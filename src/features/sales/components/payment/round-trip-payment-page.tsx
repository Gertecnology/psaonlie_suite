import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, MapPin, Calendar, Clock, Bus, CheckCircle, Download, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useRoundTrip } from '../../context/round-trip-context'
import { useActualizarEstadoPago } from '../../hooks/use-actualizar-estado-pago'
import { ResumenPago, type TramoResumen } from '../pago/resumen-pago'
import { downloadInvoice, downloadBlobAsFile } from '@/features/dashboard/services/invoice.service'
import { toast } from 'sonner'
import { OPCIONES_METODO_PAGO } from '@/lib/metodo-pago'

export function RoundTripPaymentPage() {
  const { roundTripData, setCurrentStep, resetRoundTrip } = useRoundTrip()
  const [metodoPago, setMetodoPago] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false)
  const [ventasPagadas, setVentasPagadas] = useState<string[]>([])
  const [errorPago, setErrorPago] = useState<string | null>(null)

  const actualizarEstadoPagoMutation = useActualizarEstadoPago()

  /**
   * Guarda contra doble envío: pasar la venta a PAGADO dispara la emisión del
   * boleto contra la empresa.
   *
   * Es un `ref` porque tiene que cerrarse de forma síncrona: dos clicks
   * seguidos se despachan antes de que React vuelva a renderizar. Se reabre
   * sólo si quedó alguna venta sin cobrar.
   */
  const cobroCerrado = useRef(false)

  const tramos = useMemo<TramoResumen[]>(() => {
    const lista: TramoResumen[] = []

    if (roundTripData.ida.asientos?.length) {
      lista.push({
        etiqueta: 'Ida',
        asientos: roundTripData.ida.asientos,
        serviceCharge: roundTripData.ida.serviceCharge,
      })
    }

    if (roundTripData.vuelta?.asientos?.length) {
      lista.push({
        etiqueta: 'Vuelta',
        asientos: roundTripData.vuelta.asientos,
        serviceCharge: roundTripData.vuelta.serviceCharge,
      })
    }

    return lista
  }, [roundTripData])

  const ventasAConfirmar = useMemo(
    () =>
      [
        { etiqueta: 'Ida', venta: roundTripData.ida.ventaConfirmada },
        { etiqueta: 'Vuelta', venta: roundTripData.vuelta?.ventaConfirmada },
      ].filter((item): item is { etiqueta: string; venta: NonNullable<typeof item.venta> } => !!item.venta),
    [roundTripData],
  )

  const handleGoBack = () => {
    setCurrentStep('checkout')
  }

  const handleDownloadInvoice = async (numeroTransaccion: string) => {
    if (isDownloadingInvoice) return
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

  /**
   * Registra el cobro venta por venta.
   *
   * Cada venta se marca como pagada por separado y sólo se da por cobrada la
   * que el backend confirmó. Antes se mostraba "Pagos confirmados
   * exitosamente" aunque la respuesta trajera un fallo, porque el service
   * decidía sólo con `response.ok` y el backend responde 200 con
   * `success: false`.
   */
  const handleConfirmPayment = async () => {
    if (cobroCerrado.current) return

    if (!metodoPago) {
      toast.error('Por favor selecciona un método de pago')
      return
    }

    if (ventasAConfirmar.length === 0) {
      toast.error('No hay ventas confirmadas para cobrar')
      return
    }

    cobroCerrado.current = true
    setErrorPago(null)

    const pagadas: string[] = [...ventasPagadas]
    const fallidas: string[] = []

    for (const { etiqueta, venta } of ventasAConfirmar) {
      // Si ya se cobró en un intento anterior, no se vuelve a mandar.
      if (pagadas.includes(venta.ventaId)) continue

      try {
        await actualizarEstadoPagoMutation.mutateAsync({
          ventaId: venta.ventaId,
          data: {
            estadoPago: 'PAGADO',
            metodoPago,
            observaciones: observaciones || undefined,
          },
        })
        pagadas.push(venta.ventaId)
      } catch (error) {
        fallidas.push(
          `${etiqueta}: ${error instanceof Error ? error.message : 'error desconocido'}`,
        )
      }
    }

    setVentasPagadas(pagadas)

    if (fallidas.length > 0) {
      const mensaje = `No se pudo registrar el cobro de: ${fallidas.join(' · ')}`
      setErrorPago(mensaje)
      toast.error('El cobro quedó incompleto', {
        description: mensaje,
        duration: 12000,
      })

      // Quedó algo sin cobrar: se puede reintentar sólo lo que falló.
      cobroCerrado.current = false
      return
    }

    toast.success('Cobro registrado', {
      description: `${pagadas.length} venta(s) marcadas como pagadas.`,
      duration: 6000,
    })
  }

  const cobrando = actualizarEstadoPagoMutation.isPending
  const todoCobrado =
    ventasAConfirmar.length > 0 &&
    ventasAConfirmar.every(({ venta }) => ventasPagadas.includes(venta.ventaId))

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            disabled={cobrando || todoCobrado}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Registrar cobro</h1>
            <p className="text-sm text-muted-foreground">
              La venta ya está confirmada. Registrá cómo pagó el cliente.
            </p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          Venta confirmada
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Resumen de ambos viajes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Viaje de Ida */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bus className="h-3 w-3" />
                Viaje de Ida
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-blue-600" />
                  <span className="text-sm font-medium">{roundTripData.ida.origen?.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-red-600" />
                  <span className="text-sm font-medium">{roundTripData.ida.destino?.nombre}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{roundTripData.ida.fecha?.toISOString().split('T')[0]}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{roundTripData.ida.servicio?.Embarque}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Asientos:</p>
                {roundTripData.ida.asientos && roundTripData.ida.asientos.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {roundTripData.ida.asientos.map((asiento) => (
                      <Badge key={asiento.numero} variant="secondary" className="text-xs px-2 py-0">
                        {asiento.numero} - {asiento.tipo}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No se encontraron asientos</p>
                )}
              </div>

              {roundTripData.ida.ventaConfirmada && (
                <div className="flex items-center justify-between pt-1 border-t">
                  <span className="text-xs text-muted-foreground">
                    Transacción {roundTripData.ida.ventaConfirmada.numeroTransaccion}
                  </span>
                  <Badge
                    variant={
                      ventasPagadas.includes(roundTripData.ida.ventaConfirmada.ventaId)
                        ? 'default'
                        : 'outline'
                    }
                    className="text-xs"
                  >
                    {ventasPagadas.includes(roundTripData.ida.ventaConfirmada.ventaId)
                      ? 'PAGADO'
                      : roundTripData.ida.ventaConfirmada.estado}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Viaje de Vuelta */}
          {roundTripData.vuelta && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bus className="h-3 w-3" />
                  Viaje de Vuelta
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-blue-600" />
                    <span className="text-sm font-medium">{roundTripData.vuelta.origen?.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-red-600" />
                    <span className="text-sm font-medium">{roundTripData.vuelta.destino?.nombre}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{roundTripData.vuelta.fecha?.toISOString().split('T')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{roundTripData.vuelta.servicio?.Embarque}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Asientos:</p>
                  {roundTripData.vuelta.asientos && roundTripData.vuelta.asientos.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {roundTripData.vuelta.asientos.map((asiento) => (
                        <Badge key={asiento.numero} variant="secondary" className="text-xs px-2 py-0">
                          {asiento.numero} - {asiento.tipo}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No se encontraron asientos</p>
                  )}
                </div>

                {roundTripData.vuelta.ventaConfirmada && (
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-xs text-muted-foreground">
                      Transacción {roundTripData.vuelta.ventaConfirmada.numeroTransaccion}
                    </span>
                    <Badge
                      variant={
                        ventasPagadas.includes(roundTripData.vuelta.ventaConfirmada.ventaId)
                          ? 'default'
                          : 'outline'
                      }
                      className="text-xs"
                    >
                      {ventasPagadas.includes(roundTripData.vuelta.ventaConfirmada.ventaId)
                        ? 'PAGADO'
                        : roundTripData.vuelta.ventaConfirmada.estado}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Resumen de Pago */}
        <div className="space-y-4">
          <ResumenPago tramos={tramos} titulo="Total a cobrar" />

          <Card>
            <CardContent className="pt-6 space-y-3">
              {errorPago && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errorPago}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="metodoPago" className="text-sm font-medium">
                  Método de Pago *
                </Label>
                <Select value={metodoPago} onValueChange={setMetodoPago} disabled={todoCobrado}>
                  <SelectTrigger className="h-8 w-full">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCIONES_METODO_PAGO.map((metodo) => (
                      <SelectItem key={metodo.value} value={metodo.value}>
                        {metodo.label}
                      </SelectItem>
                    ))}
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
                  disabled={todoCobrado}
                />
              </div>

              {!todoCobrado && (
                <Button
                  onClick={handleConfirmPayment}
                  className="w-full"
                  size="sm"
                  disabled={!metodoPago || cobrando}
                >
                  {cobrando ? 'Registrando cobro...' : 'Confirmar cobro'}
                </Button>
              )}

              {todoCobrado && (
                <>
                  <Separator />
                  <p className="text-sm font-medium text-green-700">
                    Cobro registrado. Ya podés descargar las facturas.
                  </p>

                  {ventasAConfirmar.map(({ etiqueta, venta }) => (
                    <Button
                      key={venta.ventaId}
                      onClick={() => handleDownloadInvoice(venta.numeroTransaccion)}
                      variant="outline"
                      className="w-full"
                      size="sm"
                      disabled={isDownloadingInvoice}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloadingInvoice ? 'Descargando...' : `Descargar factura ${etiqueta}`}
                    </Button>
                  ))}

                  <Button
                    onClick={resetRoundTrip}
                    variant="secondary"
                    className="w-full"
                    size="sm"
                  >
                    Nueva venta
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
