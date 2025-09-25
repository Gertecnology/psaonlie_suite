import { useState } from 'react'
import { ArrowLeft, MapPin, Calendar, Clock, Bus, CreditCard, CheckCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useRoundTrip } from '../../context/round-trip-context'
import { useActualizarEstadoPago } from '../../hooks/use-actualizar-estado-pago'
import { downloadInvoice, downloadBlobAsFile } from '@/features/dashboard/services/invoice.service'
import type { ServiceCharge } from '../../models/sales.model'
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

export function RoundTripPaymentPage() {
  const { roundTripData, setCurrentStep } = useRoundTrip()
  const [metodoPago, setMetodoPago] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false)
  const [isPaid, setIsPaid] = useState(false)

  const actualizarEstadoPagoMutation = useActualizarEstadoPago()

  // Calcular totales con ServiceCharge
  const subtotalIda = roundTripData.ida.asientos?.reduce((total, seat) => total + seat.precio, 0) || 0
  const subtotalVuelta = roundTripData.vuelta?.asientos?.reduce((total, seat) => total + seat.precio, 0) || 0
  const serviceChargeIda = calculateServiceCharge(subtotalIda, roundTripData.ida.serviceCharge)
  const serviceChargeVuelta = calculateServiceCharge(subtotalVuelta, roundTripData.vuelta?.serviceCharge)
  
  const totalIda = subtotalIda + serviceChargeIda
  const totalVuelta = subtotalVuelta + serviceChargeVuelta
  const subtotal = subtotalIda + subtotalVuelta
  const totalServiceCharges = serviceChargeIda + serviceChargeVuelta
  const total = subtotal + totalServiceCharges

  const handleGoBack = () => {
    setCurrentStep('checkout')
  }

  const handleDownloadInvoice = async (numeroTransaccion: string) => {
    setIsDownloadingInvoice(true)

    try {
      const invoiceResponse = await downloadInvoice(numeroTransaccion)
      downloadBlobAsFile(invoiceResponse.data, invoiceResponse.filename)
      
      toast.success('Factura descargada exitosamente', {
        description: `Archivo: ${invoiceResponse.filename}`,
        duration: 3000,
      })
    } catch (error) {
      toast.error('Error al descargar la factura', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsDownloadingInvoice(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!metodoPago) {
      toast.error('Por favor selecciona un método de pago')
      return
    }

    setIsProcessingPayment(true)

    try {
      // Actualizar estado de pago para ambas ventas secuencialmente
      const ventasActualizadas = []

      // Actualizar venta de ida
      if (roundTripData.ida.ventaConfirmada) {
        const resultadoIda = await actualizarEstadoPagoMutation.mutateAsync({
          ventaId: roundTripData.ida.ventaConfirmada.ventaId,
          data: {
            estadoPago: 'PAGADO',
            metodoPago: metodoPago,
            observaciones: observaciones || undefined
          }
        })
        ventasActualizadas.push(resultadoIda)
      }

      // Actualizar venta de vuelta (si existe)
      if (roundTripData.vuelta?.ventaConfirmada) {
        const resultadoVuelta = await actualizarEstadoPagoMutation.mutateAsync({
          ventaId: roundTripData.vuelta.ventaConfirmada.ventaId,
          data: {
            estadoPago: 'PAGADO',
            metodoPago: metodoPago,
            observaciones: observaciones || undefined
          }
        })
        ventasActualizadas.push(resultadoVuelta)
      }

      toast.success('Pagos confirmados exitosamente', {
        description: `Se procesaron ${ventasActualizadas.length} pago(s) correctamente`,
        duration: 5000,
      })

      // Actualizar estado para mostrar botones de descarga de factura
      setIsPaid(true)

    } catch (error) {
      toast.error('Error al confirmar los pagos', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Procesar Pago</h1>
            <p className="text-sm text-muted-foreground">
              Confirma tu reserva y procede con el pago
            </p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          Reserva Confirmada
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Resumen de ambos viajes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Viaje de Ida */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bus className="h-4 w-4" />
                Viaje de Ida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium">{roundTripData.ida.origen?.nombre}</p>
                  <p className="text-sm text-muted-foreground">Origen</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-red-600" />
                <div>
                  <p className="font-medium">{roundTripData.ida.destino?.nombre}</p>
                  <p className="text-sm text-muted-foreground">Destino</p>
                </div>
              </div>

              <Separator />

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
                    <p className="text-sm font-medium">{roundTripData.ida.servicio?.Embarque}</p>
                    <p className="text-xs text-muted-foreground">Hora</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Asientos Seleccionados:</p>
                {roundTripData.ida.asientos && roundTripData.ida.asientos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {roundTripData.ida.asientos.map((asiento, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        Asiento {asiento.numero} - {asiento.tipo} - Piso {asiento.piso}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No se encontraron asientos seleccionados</p>
                )}
              </div>

              {/* Información de la venta de ida */}
              {roundTripData.ida.ventaConfirmada && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Número de Transacción</p>
                      <p className="text-xs text-muted-foreground font-mono">{roundTripData.ida.ventaConfirmada.numeroTransaccion}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Estado</p>
                      <Badge variant="outline" className="text-xs">
                        {roundTripData.ida.ventaConfirmada.estado}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium">Mensaje</p>
                      <p className="text-xs text-muted-foreground">{roundTripData.ida.ventaConfirmada.mensaje}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Viaje de Vuelta */}
          {roundTripData.vuelta && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bus className="h-4 w-4" />
                  Viaje de Vuelta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium">{roundTripData.vuelta.origen?.nombre}</p>
                    <p className="text-sm text-muted-foreground">Origen</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-medium">{roundTripData.vuelta.destino?.nombre}</p>
                    <p className="text-sm text-muted-foreground">Destino</p>
                  </div>
                </div>

                <Separator />

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

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-medium">Asientos Seleccionados:</p>
                  {roundTripData.vuelta.asientos && roundTripData.vuelta.asientos.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {roundTripData.vuelta.asientos.map((asiento, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          Asiento {asiento.numero} - {asiento.tipo} - Piso {asiento.piso}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No se encontraron asientos seleccionados</p>
                  )}
                </div>

                {/* Información de la venta de vuelta */}
                {roundTripData.vuelta.ventaConfirmada && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Número de Transacción</p>
                        <p className="text-xs text-muted-foreground font-mono">{roundTripData.vuelta.ventaConfirmada.numeroTransaccion}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium">Estado</p>
                        <Badge variant="outline" className="text-xs">
                          {roundTripData.vuelta.ventaConfirmada.estado}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-sm font-medium">Mensaje</p>
                        <p className="text-xs text-muted-foreground">{roundTripData.vuelta.ventaConfirmada.mensaje}</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumen de Pago */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Resumen de Pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {/* Viaje de Ida */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Viaje de Ida</span>
                    <span>₲ {subtotalIda.toLocaleString()}</span>
                  </div>
                  {serviceChargeIda > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground ml-4">
                      <span>
                        {roundTripData.ida.serviceCharge?.nombre}
                        {roundTripData.ida.serviceCharge?.tipoAplicacion === 'PORCENTUAL' && 
                          ` (${roundTripData.ida.serviceCharge.porcentaje}%)`
                        }
                      </span>
                      <span>₲ {serviceChargeIda.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-medium">
                    <span>Subtotal Ida</span>
                    <span>₲ {totalIda.toLocaleString()}</span>
                  </div>
                </div>

                {/* Viaje de Vuelta */}
                {roundTripData.vuelta && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Viaje de Vuelta</span>
                      <span>₲ {subtotalVuelta.toLocaleString()}</span>
                    </div>
                    {serviceChargeVuelta > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground ml-4">
                        <span>
                          {roundTripData.vuelta?.serviceCharge?.nombre}
                          {roundTripData.vuelta?.serviceCharge?.tipoAplicacion === 'PORCENTUAL' && 
                            ` (${roundTripData.vuelta.serviceCharge.porcentaje}%)`
                          }
                        </span>
                        <span>₲ {serviceChargeVuelta.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium">
                      <span>Subtotal Vuelta</span>
                      <span>₲ {totalVuelta.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₲ {subtotal.toLocaleString()}</span>
                </div>
                {totalServiceCharges > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Cargos por Servicio</span>
                    <span>₲ {totalServiceCharges.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>₲ {total.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              {/* Formulario de Confirmación de Pago */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="metodoPago" className="text-sm font-medium">
                    Método de Pago *
                  </Label>
                  <Select value={metodoPago} onValueChange={setMetodoPago}>
                    <SelectTrigger className="h-8 w-full">
                      <SelectValue placeholder="Seleccionar método" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia Bancaria</SelectItem>
                      <SelectItem value="BANCARD">Bancard</SelectItem>
                      <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="observaciones" className="text-sm font-medium">
                    Observaciones
                  </Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Observaciones adicionales sobre el pago..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="h-16 text-sm"
                  />
                </div>

                <Button 
                  onClick={handleConfirmPayment}
                  className="w-full"
                  size="sm"
                  disabled={!metodoPago || isProcessingPayment}
                >
                  {isProcessingPayment ? 'Confirmando...' : 'Confirmar Pago'}
                </Button>

                {/* Botones de descarga de factura - solo visible cuando está pagado */}
                {isPaid && (
                  <div className="space-y-2">
                    {roundTripData.ida.ventaConfirmada && (
                      <Button 
                        onClick={() => handleDownloadInvoice(roundTripData.ida.ventaConfirmada!.numeroTransaccion)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                        disabled={isDownloadingInvoice}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isDownloadingInvoice ? 'Descargando...' : 'Descargar Factura Ida'}
                      </Button>
                    )}
                    
                    {roundTripData.vuelta?.ventaConfirmada && (
                      <Button 
                        onClick={() => handleDownloadInvoice(roundTripData.vuelta!.ventaConfirmada!.numeroTransaccion)}
                        variant="outline"
                        className="w-full"
                        size="sm"
                        disabled={isDownloadingInvoice}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isDownloadingInvoice ? 'Descargando...' : 'Descargar Factura Vuelta'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
