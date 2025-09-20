import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Calendar, Clock, Users, Lock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ClientForm } from './client-form'
import type { Asiento } from '../../models/sales.model'
import type { CreateClientFormValues } from '@/features/clients/models/clients.model'
import { useCreateClient } from '@/features/clients/hooks/use-client-mutations'
import { useConfirmarVenta } from '../../hooks/use-confirmar-venta'
import { toast } from 'sonner'

// Extend the client form values to include seat number for checkout
type ClientWithSeat = CreateClientFormValues & { seatNumber?: number }

interface CheckoutSearch {
  servicioId: string
  origenId: string
  destinoId: string
  empresaId: string
  empresa?: string
  origen?: string
  destino?: string
  fecha?: string
  hora?: string
  serviceCharge?: string
  asientosIds: string
  precios: string
  tipos: string
  pisos: string
  codigoReferencia: string
  empresaBoleto?: string // Emp del servicio
  calidad?: string // Calidad del servicio
}

export function CheckoutPage() {
  const [search, setSearch] = useState<CheckoutSearch | null>(null)
  const [asientos, setAsientos] = useState<Asiento[]>([])
  const [clientsData, setClientsData] = useState<ClientWithSeat[]>([])
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const createClientMutation = useCreateClient()
  const confirmarVentaMutation = useConfirmarVenta()

  useEffect(() => {
    // Get search parameters from URL
    const urlParams = new URLSearchParams(window.location.search)
    const searchData: CheckoutSearch = {
      servicioId: urlParams.get('servicioId') || '',
      origenId: urlParams.get('origenId') || '',
      destinoId: urlParams.get('destinoId') || '',
      empresaId: urlParams.get('empresaId') || '',
      empresa: urlParams.get('empresa') || undefined,
      origen: urlParams.get('origen') || undefined,
      destino: urlParams.get('destino') || undefined,
      fecha: urlParams.get('fecha') || undefined,
      hora: urlParams.get('hora') || undefined,
      serviceCharge: urlParams.get('serviceCharge') || undefined,
      asientosIds: urlParams.get('asientosIds') || '',
      precios: urlParams.get('precios') || '',
      tipos: urlParams.get('tipos') || '',
      pisos: urlParams.get('pisos') || '',
      codigoReferencia: urlParams.get('codigoReferencia') || '',
      empresaBoleto: urlParams.get('empresaBoleto') || undefined,
      calidad: urlParams.get('calidad') || undefined,
    }
    setSearch(searchData)

    // Parse seats data
    if (searchData.asientosIds && searchData.precios && searchData.tipos && searchData.pisos) {
      const asientosIds = searchData.asientosIds.split(',')
      const precios = searchData.precios.split(',').map(Number)
      const tipos = searchData.tipos.split(',') as ('VENTANA' | 'PASILLO' | 'CENTRO')[]
      const pisos = searchData.pisos.split(',').map(Number)

      const asientosData: Asiento[] = asientosIds.map((id, index) => ({
        numero: id,
        disponible: true,
        precio: precios[index],
        tipo: tipos[index],
        piso: pisos[index],
        calidad: 'Estándar', // Default quality
      }))

      setAsientos(asientosData)
    }
  }, [])

  const handleGoBack = () => {
    if (search) {
      // Navigate back to seats page with blocked seats info
      const seatsParams = new URLSearchParams({
        servicioId: search.servicioId,
        origenId: search.origenId,
        destinoId: search.destinoId,
        empresaId: search.empresaId,
        empresa: search.empresa || '',
        origen: search.origen || '',
        destino: search.destino || '',
        fecha: search.fecha || '',
        hora: search.hora || '',
        serviceCharge: search.serviceCharge || '',
        codigoReferencia: search.codigoReferencia,
        asientosBloqueados: search.asientosIds,
        preciosBloqueados: search.precios,
        tiposBloqueados: search.tipos,
        pisosBloqueados: search.pisos,
      })
      window.location.href = `/sales/seats?${seatsParams.toString()}`
    } else {
      window.location.href = '/sales/seats'
    }
  }

  const handleClientCreated = (client: CreateClientFormValues, seatNumber: number) => {
    setClientsData(prev => {
      const existingIndex = prev.findIndex(c => c.seatNumber === seatNumber)
      if (existingIndex >= 0) {
        // Actualizar cliente existente para este asiento
        const updated = [...prev]
        updated[existingIndex] = { ...client, seatNumber }
        return updated
      } else {
        // Agregar nuevo cliente
        return [...prev, { ...client, seatNumber }]
      }
    })
  }

  const handleProceedToPayment = async () => {
    if (!search || clientsData.length !== asientos.length) {
      toast.error('Por favor completa todos los formularios de clientes')
      return
    }

    setIsProcessingPayment(true)

    try {
      // Crear todos los clientes primero
      const clientIds: { [seatNumber: number]: string } = {}
      
      for (const clientData of clientsData) {
        const response = await createClientMutation.mutateAsync(clientData)
        clientIds[clientData.seatNumber!] = response.cliente.id
      }

      // Preparar datos para confirmar venta
      const ventaData = {
        ventas: [{
          bloqueoCodigoReferencia: search.codigoReferencia,
          servicioId: search.servicioId,
          empresaId: search.empresaId,
          EmpresaBoleto: search.empresaBoleto || 'SOL', // Usar Emp del servicio
          calidad: search.calidad || 'CA', // Usar Calidad del servicio
          origenId: search.origenId,
          destinoId: search.destinoId,
          metodoPago: 'EFECTIVO', // Por defecto, se puede cambiar después
          estadoPago: 'PENDIENTE', // Cambiado a PENDIENTE como solicitado
          importeTotal: asientos.reduce((total, asiento) => total + asiento.precio, 0),
          asiento: asientos.map(asiento => ({
            Nroasiento: asiento.numero,
            Precio: asiento.precio,
            clienteId: clientIds[parseInt(asiento.numero)]
          }))
        }]
      }

      // Confirmar la venta
      const ventaResponse = await confirmarVentaMutation.mutateAsync(ventaData)
      
      // Si llegamos aquí, la venta fue exitosa
      toast.success('Venta confirmada exitosamente', {
        description: `Se procesaron ${ventaResponse.exitosas} venta(s) correctamente`,
        duration: 5000,
      })

      // Obtener datos de la venta exitosa
      const ventaExitosa = ventaResponse.resultados[0]?.venta
      if (ventaExitosa) {
        // Construir URL para página de pago con todos los datos necesarios
        const paymentParams = new URLSearchParams({
          servicioId: search.servicioId,
          origenId: search.origenId,
          destinoId: search.destinoId,
          empresaId: search.empresaId,
          empresa: search.empresa || '',
          origen: search.origen || '',
          destino: search.destino || '',
          fecha: search.fecha || '',
          hora: search.hora || '',
          serviceCharge: search.serviceCharge || '',
          asientosIds: asientos.map(asiento => asiento.numero).join(','),
          precios: asientos.map(asiento => asiento.precio.toString()).join(','),
          tipos: asientos.map(asiento => asiento.tipo).join(','),
          pisos: asientos.map(asiento => asiento.piso.toString()).join(','),
          codigoReferencia: search.codigoReferencia || '',
          empresaBoleto: search.empresaBoleto || '',
          calidad: search.calidad || '',
          ventaId: ventaExitosa.ventaId,
          numeroTransaccion: ventaExitosa.numeroTransaccion,
          estado: ventaExitosa.estado,
          mensaje: ventaExitosa.mensaje,
          comisionTotal: ventaExitosa.comisionTotal.toString(),
        })
        
        // Redirigir a página de pago
        window.location.href = `/sales/payment?${paymentParams.toString()}`
      }

    } catch (error) {
      // TODO: Show error message to user
      toast.error('Error al procesar el pago', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (!search || !search.servicioId) {
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

  const subtotal = asientos.reduce((total, seat) => total + seat.precio, 0)
  const serviceChargeAmount = search.serviceCharge 
    ? Math.round(subtotal * (parseFloat(search.serviceCharge) / 100))
    : 0
  const total = subtotal + serviceChargeAmount

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-xl font-bold">Checkout</h1>
          <p className="text-sm text-muted-foreground">
            Completa la información del cliente para proceder al pago
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">{search.origen}</p>
                      <p className="text-xs text-muted-foreground">Origen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">{search.destino}</p>
                      <p className="text-xs text-muted-foreground">Destino</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{search.fecha?.split('T')[0]}</p>
                      <p className="text-xs text-muted-foreground">Fecha</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{search.hora}</p>
                      <p className="text-xs text-muted-foreground">Hora</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{search.empresa}</p>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                  </div>
                </div>
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
                    <span className="text-sm font-medium text-muted-foreground">Asientos ({asientos.length})</span>
                  </div>
                  {asientos.map((seat) => (
                    <div key={seat.numero} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Asiento {seat.numero}</span>
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
                
                {search.serviceCharge && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Servicio ({search.serviceCharge}%)</span>
                    <span className="text-sm font-medium">
                      {new Intl.NumberFormat('es-PY', {
                        style: 'currency',
                        currency: 'PYG',
                        minimumFractionDigits: 0,
                      }).format(serviceChargeAmount)}
                    </span>
                  </div>
                )}
                
                <Separator />
                
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
          {/* Render one form per seat */}
          {asientos.map((asiento, index) => {
            const seatNumber = parseInt(asiento.numero)
            const clientForSeat = clientsData.find(c => c.seatNumber === seatNumber)
            return (
              <ClientForm
                key={asiento.numero}
                empresaId={search.empresaId}
                empresaNombre={search.empresa}
                onClientCreated={(client) => handleClientCreated(client, seatNumber)}
                isClientCreated={!!clientForSeat}
                seatNumber={seatNumber}
                passengerNumber={index + 1}
              />
            )
          })}

          {/* Action Button */}
          <Button 
            onClick={handleProceedToPayment}
            className="w-full"
            size="lg"
            disabled={clientsData.length !== asientos.length || isProcessingPayment}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isProcessingPayment 
              ? 'Procesando pago...' 
              : clientsData.length === asientos.length 
                ? 'Continuar al Pago' 
                : `Completa los datos de ${asientos.length - clientsData.length} cliente(s) restante(s)`
            }
          </Button>
        </div>
      </div>
    </div>
  )
}
