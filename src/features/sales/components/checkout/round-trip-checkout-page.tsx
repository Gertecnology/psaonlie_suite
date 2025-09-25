import { useState } from 'react'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Lock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ClientForm } from './client-form'
import { useRoundTrip } from '../../context/round-trip-context'
import { useCreateClient } from '@/features/clients/hooks/use-client-mutations'
import { useConfirmarVenta } from '../../hooks/use-confirmar-venta'
import type { ClientWithSeat, ServiceCharge } from '../../models/sales.model'
import type { CreateClientFormValues } from '@/features/clients/models/clients.model'
import { toast } from 'sonner'

// Helper function to calculate service charge
const calculateServiceCharge = (subtotal: number, serviceCharge?: ServiceCharge): number => {
  if (!serviceCharge || !serviceCharge.activo) return 0
  
  if (serviceCharge.tipoAplicacion === 'PORCENTUAL' || serviceCharge.tipoAplicacion === 'PORCENTAJE') {
    return Math.round(subtotal * (parseFloat(serviceCharge.porcentaje) / 100))
  } else if (serviceCharge.tipoAplicacion === 'MONTO_FIJO' && serviceCharge.montoFijo) {
    return serviceCharge.montoFijo
  }
  
  return 0
}

interface RoundTripCheckoutPageProps {
  onComplete?: () => void
}

export function RoundTripCheckoutPage({ onComplete: _onComplete }: RoundTripCheckoutPageProps) {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()
  const [clientsData, setClientsData] = useState<ClientWithSeat[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const createClientMutation = useCreateClient()
  const confirmarVentaMutation = useConfirmarVenta()

  // Crear formularios por pasajero, no por asiento
  // Si hay múltiples asientos, cada pasajero viaja en ambos viajes
  const maxAsientos = Math.max(
    roundTripData.ida.asientos?.length || 0,
    roundTripData.vuelta?.asientos?.length || 0
  )
  
  const passengerForms = Array.from({ length: maxAsientos }, (_, index) => ({
    passengerNumber: index + 1,
    asientoIda: roundTripData.ida.asientos?.[index],
    asientoVuelta: roundTripData.vuelta?.asientos?.[index],
    empresaIdIda: roundTripData.ida.empresaId,
    empresaIdVuelta: roundTripData.vuelta?.empresaId,
    empresaNombreIda: roundTripData.ida.servicio?.Emp,
    empresaNombreVuelta: roundTripData.vuelta?.servicio?.Emp,
    tripLabelIda: `${roundTripData.ida.origen?.nombre} → ${roundTripData.ida.destino?.nombre}`,
    tripLabelVuelta: roundTripData.vuelta ? `${roundTripData.vuelta.origen?.nombre} → ${roundTripData.vuelta.destino?.nombre}` : null
  }))

  // Combinar todos los asientos para cálculos de precio
  const allSeats = [
    ...(roundTripData.ida.asientos || []).map(seat => ({ 
      ...seat, 
      tripType: 'ida' as const,
      tripLabel: `${roundTripData.ida.origen?.nombre} → ${roundTripData.ida.destino?.nombre}`
    })),
    ...(roundTripData.vuelta?.asientos || []).map(seat => ({ 
      ...seat, 
      tripType: 'vuelta' as const,
      tripLabel: `${roundTripData.vuelta?.origen?.nombre} → ${roundTripData.vuelta?.destino?.nombre}`
    }))
  ]

  const handleClientCreated = (client: CreateClientFormValues, passengerNumber: number) => {
    setClientsData(prev => {
      const existingIndex = prev.findIndex(c => c.passengerNumber === passengerNumber)
      if (existingIndex >= 0) {
        // Actualizar cliente existente para este pasajero
        const updated = [...prev]
        updated[existingIndex] = { ...client, passengerNumber }
        return updated
      } else {
        // Agregar nuevo cliente para este pasajero
        return [...prev, { ...client, passengerNumber }]
      }
    })
  }

  const handleProceedToPayment = async () => {
    if (!roundTripData.ida.servicio || !roundTripData.ida.codigoReferencia) {
      toast.error('Faltan datos del viaje de ida')
      return
    }

    if (roundTripData.vuelta && (!roundTripData.vuelta.servicio || !roundTripData.vuelta.codigoReferencia)) {
      toast.error('Faltan datos del viaje de vuelta')
      return
    }

    if (clientsData.length !== passengerForms.length) {
      toast.error('Por favor completa todos los formularios de clientes')
      return
    }

    setIsProcessingPayment(true)

    try {
      // 1. Crear todos los clientes primero
      const clientIds: { [passengerNumber: number]: string } = {}
      
      for (const clientData of clientsData) {
        const response = await createClientMutation.mutateAsync(clientData)
        clientIds[clientData.passengerNumber!] = response.cliente.id
      }

      // 2. Preparar las ventas para el array
      const ventas = []

      // Venta de IDA
      // Calcular totales con cargo por servicio
      const subtotalIda = roundTripData.ida.asientos!.reduce((total, asiento) => total + asiento.precio, 0)
      const serviceChargeIda = calculateServiceCharge(subtotalIda, roundTripData.ida.serviceCharge)
      const totalIda = subtotalIda + serviceChargeIda

      const ventaIda = {
        bloqueoCodigoReferencia: roundTripData.ida.codigoReferencia!,
        servicioId: roundTripData.ida.servicio.Id,
        empresaId: roundTripData.ida.empresaId!,
        EmpresaBoleto: roundTripData.ida.servicio.Emp,
        calidad: roundTripData.ida.servicio.Calidad,
        origenId: roundTripData.ida.origen!.id,
        destinoId: roundTripData.ida.destino!.id,
        metodoPago: 'EFECTIVO', // Se puede cambiar después en el pago
        estadoPago: 'PENDIENTE',
        importeTotal: totalIda,
        asiento: roundTripData.ida.asientos!.map((asiento, index) => ({
          Nroasiento: asiento.numero,
          Precio: asiento.precio,
          clienteId: clientIds[index + 1] // Cliente según posición del asiento
        }))
      }
      ventas.push(ventaIda)

      // Venta de VUELTA (si existe)
      if (roundTripData.vuelta?.servicio && roundTripData.vuelta?.codigoReferencia) {
        // Calcular totales con cargo por servicio para vuelta
        const subtotalVuelta = roundTripData.vuelta.asientos!.reduce((total, asiento) => total + asiento.precio, 0)
        const serviceChargeVuelta = calculateServiceCharge(subtotalVuelta, roundTripData.vuelta.serviceCharge)
        const totalVuelta = subtotalVuelta + serviceChargeVuelta

        const ventaVuelta = {
          bloqueoCodigoReferencia: roundTripData.vuelta.codigoReferencia,
          servicioId: roundTripData.vuelta.servicio.Id,
          empresaId: roundTripData.vuelta.empresaId!,
          EmpresaBoleto: roundTripData.vuelta.servicio.Emp,
          calidad: roundTripData.vuelta.servicio.Calidad,
          origenId: roundTripData.vuelta.origen!.id,
          destinoId: roundTripData.vuelta.destino!.id,
          metodoPago: 'EFECTIVO', // Se puede cambiar después en el pago
          estadoPago: 'PENDIENTE',
          importeTotal: totalVuelta,
          asiento: roundTripData.vuelta.asientos!.map((asiento, index) => ({
            Nroasiento: asiento.numero,
            Precio: asiento.precio,
            clienteId: clientIds[index + 1] // Cliente según posición del asiento
          }))
        }
        ventas.push(ventaVuelta)
      }

      // 3. Preparar la petición con ambas ventas
      const ventaData = {
        ventas: ventas
      }

      // 4. Confirmar ambas ventas en una sola petición
      const ventaResponse = await confirmarVentaMutation.mutateAsync(ventaData)
      
      toast.success('Ventas confirmadas exitosamente', {
        description: `Se procesaron ${ventaResponse.exitosas} venta(s) correctamente`,
        duration: 5000,
      })

      // 5. Guardar los datos de las ventas exitosas para el pago
      const ventasExitosas = ventaResponse.resultados
        .filter(resultado => resultado.exitoso && resultado.venta)
        .map(resultado => resultado.venta!)

      // Guardar en el contexto para usar en la página de pago
      setRoundTripData({
        ida: {
          ...roundTripData.ida,
          ventaConfirmada: ventasExitosas[0] // Primera venta es la de ida
        },
        vuelta: roundTripData.vuelta ? {
          ...roundTripData.vuelta,
          ventaConfirmada: ventasExitosas[1] // Segunda venta es la de vuelta
        } : undefined
      })

      // 6. Ir a la página de pago
      setCurrentStep('payment')

    } catch (error) {
      toast.error('Error al procesar las ventas', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleGoBack = () => {
    if (roundTripData.vuelta?.asientos) {
      setCurrentStep('vuelta-seats')
    } else {
      setCurrentStep('ida-seats')
    }
  }

  if (!roundTripData.ida.servicio) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            No se encontró información del servicio. Por favor, selecciona un servicio desde la página anterior.
          </AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Selección de Asientos
        </Button>
      </div>
    )
  }

  const subtotalIda = roundTripData.ida.asientos?.reduce((total, seat) => total + seat.precio, 0) || 0
  const subtotalVuelta = roundTripData.vuelta?.asientos?.reduce((total, seat) => total + seat.precio, 0) || 0
  const serviceChargeIda = calculateServiceCharge(subtotalIda, roundTripData.ida.serviceCharge)
  const serviceChargeVuelta = calculateServiceCharge(subtotalVuelta, roundTripData.vuelta?.serviceCharge)
  
  const subtotal = subtotalIda + subtotalVuelta
  const totalServiceCharges = serviceChargeIda + serviceChargeVuelta
  const total = subtotal + totalServiceCharges

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-xl font-bold">Checkout - Viaje Completo</h1>
          <p className="text-sm text-muted-foreground">
            Completa la información de los pasajeros para ambos viajes
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left Column - Trip Info & Payment Summary */}
        <div className="space-y-4">
          {/* Trip Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Detalles del Viaje
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Viaje de Ida */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-blue-600">Viaje de Ida</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">{roundTripData.ida.origen?.nombre}</p>
                        <p className="text-xs text-muted-foreground">Origen</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">{roundTripData.ida.destino?.nombre}</p>
                        <p className="text-xs text-muted-foreground">Destino</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{roundTripData.ida.fecha?.toISOString().split('T')[0]}</p>
                        <p className="text-xs text-muted-foreground">Fecha</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{roundTripData.ida.servicio.Embarque}</p>
                        <p className="text-xs text-muted-foreground">Hora</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Viaje de Vuelta */}
                {roundTripData.vuelta && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-purple-600">Viaje de Vuelta</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium">{roundTripData.vuelta.origen?.nombre}</p>
                            <p className="text-xs text-muted-foreground">Origen</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <div>
                            <p className="text-sm font-medium">{roundTripData.vuelta.destino?.nombre}</p>
                            <p className="text-xs text-muted-foreground">Destino</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{roundTripData.vuelta.fecha?.toISOString().split('T')[0]}</p>
                            <p className="text-xs text-muted-foreground">Fecha</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{roundTripData.vuelta.servicio?.Embarque}</p>
                            <p className="text-xs text-muted-foreground">Hora</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Resumen de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {/* Asientos */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="h-3 w-3 text-blue-600" />
                    <span className="text-sm font-medium text-muted-foreground">Asientos ({allSeats.length})</span>
                  </div>
                  {allSeats.map((seat) => (
                    <div key={`${seat.tripType}-${seat.numero}`} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Asiento {seat.numero} - {seat.tripLabel}
                      </span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('es-PY', {
                          style: 'currency',
                          currency: 'PYG',
                          minimumFractionDigits: 0,
                        }).format(seat.precio)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat('es-PY', {
                      style: 'currency',
                      currency: 'PYG',
                      minimumFractionDigits: 0,
                    }).format(subtotal)}
                  </span>
                </div>
                
                {/* Cargos por Servicio */}
                {totalServiceCharges > 0 && (
                  <>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="h-3 w-3 text-orange-600" />
                        <span className="text-sm font-medium text-muted-foreground">Cargos por Servicio</span>
                      </div>
                      
                      {/* Cargo Ida */}
                      {serviceChargeIda > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Ida - {roundTripData.ida.serviceCharge?.nombre}
                            {roundTripData.ida.serviceCharge?.tipoAplicacion === 'PORCENTAJE' && 
                              ` (${roundTripData.ida.serviceCharge.porcentaje}%)`
                            }
                          </span>
                          <span className="font-medium">
                            {new Intl.NumberFormat('es-PY', {
                              style: 'currency',
                              currency: 'PYG',
                              minimumFractionDigits: 0,
                            }).format(serviceChargeIda)}
                          </span>
                        </div>
                      )}

                      {/* Cargo Vuelta */}
                      {serviceChargeVuelta > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Vuelta - {roundTripData.vuelta?.serviceCharge?.nombre}
                            {roundTripData.vuelta?.serviceCharge?.tipoAplicacion === 'PORCENTAJE' && 
                              ` (${roundTripData.vuelta.serviceCharge.porcentaje}%)`
                            }
                          </span>
                          <span className="font-medium">
                            {new Intl.NumberFormat('es-PY', {
                              style: 'currency',
                              currency: 'PYG',
                              minimumFractionDigits: 0,
                            }).format(serviceChargeVuelta)}
                          </span>
                        </div>
                      )}
                    </div>
                    <Separator />
                  </>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary">
                    {new Intl.NumberFormat('es-PY', {
                      style: 'currency',
                      currency: 'PYG',
                      minimumFractionDigits: 0,
                    }).format(total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Client Forms */}
        <div className="space-y-4">
          {/* Render one form per passenger */}
          {passengerForms.map((form) => {
            const clientForPassenger = clientsData.find(c => c.passengerNumber === form.passengerNumber)
            return (
              <Card key={`passenger-${form.passengerNumber}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Pasajero {form.passengerNumber}
                    <div className="flex gap-1">
                      {form.asientoIda && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Ida: Asiento {form.asientoIda.numero}
                        </span>
                      )}
                      {form.asientoVuelta && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Vuelta: Asiento {form.asientoVuelta.numero}
                        </span>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ClientForm
                    empresaId={form.empresaIdIda || ''}
                    empresaNombre={form.empresaNombreIda}
                    onClientCreated={(client) => handleClientCreated(client, form.passengerNumber)}
                    isClientCreated={!!clientForPassenger}
                    seatNumber={form.asientoIda ? parseInt(form.asientoIda.numero) : 0}
                    passengerNumber={form.passengerNumber}
                  />
                </CardContent>
              </Card>
            )
          })}

          {/* Action Button */}
          <Button 
            onClick={handleProceedToPayment}
            className="w-full"
            size="lg"
            disabled={clientsData.length !== passengerForms.length || isProcessingPayment}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isProcessingPayment 
              ? 'Procesando ventas...' 
              : clientsData.length === passengerForms.length 
                ? 'Continuar al Pago' 
                : `Completa los datos de ${passengerForms.length - clientsData.length} cliente(s) restante(s)`
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
