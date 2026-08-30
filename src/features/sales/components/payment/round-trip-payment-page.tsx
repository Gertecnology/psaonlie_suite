import { useMemo, useRef, useState } from 'react'
import { ArrowLeft, MapPin, Calendar, Clock, Bus, CheckCircle, AlertTriangle, CreditCard } from 'lucide-react'
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
import { EntregarLosDocumentos } from '../entrega/entregar-los-documentos'
import { ModalDeBancard } from './modal-de-bancard'
import { toast } from 'sonner'
import {
  ETIQUETAS_METODO_PAGO,
  OPCIONES_METODO_PAGO,
  type MetodoPago,
} from '@/lib/metodo-pago'

export function RoundTripPaymentPage() {
  const { roundTripData, setCurrentStep, resetRoundTrip } = useRoundTrip()
  const [metodoPago, setMetodoPago] = useState('')
  const [observaciones, setObservaciones] = useState('')
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
    setCurrentStep('resumen')
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

    // El que se eligió al vender manda sobre el de esta pantalla: la venta ya
    // nació con ese dato y cambiarlo acá haría que la caja diga algo distinto
    // de lo que pasó.
    const conQue = conQueSeCobro || metodoPago

    if (!conQue) {
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
      // Si ya está cobrada —nació pagada por ser en efectivo, o se cobró en un
      // intento anterior— no se vuelve a mandar. El backend rechaza
      // `PAGADO → PAGADO` como transición inválida.
      if (yaEstaCobrada(venta)) continue

      try {
        await actualizarEstadoPagoMutation.mutateAsync({
          ventaId: venta.ventaId,
          data: {
            estadoPago: 'PAGADO',
            metodoPago: conQue,
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

  /**
   * Una venta ya cobrada, sea porque nació así o porque se cobró acá.
   *
   * Nace cobrada cuando se eligió efectivo en el checkout: ahí la plata está
   * sobre el mostrador y la venta se confirma como `PAGADO`. Este paso sólo
   * mostraba lo cobrado **en esta pantalla**, así que a una venta que llegaba
   * pagada le volvía a pedir el método —y registrarlo fallaba con «Transición
   * de estado no válida: PAGADO → PAGADO»—.
   */
  const yaEstaCobrada = (venta: { ventaId: string; estadoPago?: string }) =>
    venta.estadoPago === 'PAGADO' || ventasPagadas.includes(venta.ventaId)

  const todoCobrado =
    ventasAConfirmar.length > 0 &&
    ventasAConfirmar.every(({ venta }) => yaEstaCobrada(venta))

  /**
   * Con qué se cobró, para no volver a preguntarlo.
   *
   * El método se elige en el checkout, antes de confirmar: la venta nace con
   * ese dato. Preguntarlo de nuevo acá dejaba cambiarlo después de hecha la
   * venta, y la caja terminaba diciendo algo distinto de lo que pasó.
   */
  const conQueSeCobro = ventasAConfirmar[0]?.venta.metodoPago

  /**
   * Con tarjeta el cobro no se registra a mano: lo confirma el callback de
   * Bancard. Ofrecer «Confirmar cobro» acá dejaría marcar como cobrada una
   * venta que nunca se pagó.
   */
  const conTarjeta = (conQueSeCobro || metodoPago) === 'BANCARD'

  /** Qué tramo se está cobrando con tarjeta, si hay alguno abierto. */
  const [cobrandoConTarjeta, setCobrandoConTarjeta] = useState<{
    ventaId: string
    etiqueta: string
  } | null>(null)

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

          {/* El último paso, y el que faltaba: la venta se hacía bien y el
              cliente se iba sin nada. Los documentos de una venta de caja se
              generan recién cuando se piden. */}
          {todoCobrado &&
            ventasAConfirmar.map(({ etiqueta, venta }) => (
              <div key={venta.ventaId} className="space-y-1">
                {ventasAConfirmar.length > 1 && (
                  <p className="text-muted-foreground text-xs font-medium">
                    {etiqueta}
                  </p>
                )}
                <EntregarLosDocumentos
                  numeroTransaccion={venta.numeroTransaccion}
                />
              </div>
            ))}

          <Card>
            <CardContent className="pt-6 space-y-3">
              {errorPago && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errorPago}</AlertDescription>
                </Alert>
              )}

              {/* Acá se elige cómo paga el cliente: la venta se confirmó antes,
                  sin saberlo. Si ya trae método —una venta vieja, o una que se
                  cobró en parte— sólo se muestra, para no dejar cambiarlo
                  después de registrado el cobro. */}
              {conQueSeCobro ? (
                <div className="grid gap-1">
                  <span className="text-sm font-medium">Método de pago</span>
                  <span className="text-muted-foreground text-sm">
                    {ETIQUETAS_METODO_PAGO[conQueSeCobro as MetodoPago] ??
                      conQueSeCobro}
                  </span>
                </div>
              ) : (
                <div>
                  <Label htmlFor="metodoPago" className="text-sm font-medium">
                    Método de Pago *
                  </Label>
                  <Select
                    value={metodoPago}
                    onValueChange={setMetodoPago}
                    disabled={todoCobrado}
                  >
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
              )}

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

              {/* Con tarjeta se abre la pasarela; el cobro lo confirma el
                  callback de Bancard. Un tramo por vez: son dos ventas
                  distintas y la empresa las cobra por separado. */}
              {!todoCobrado && conTarjeta && (
                <div className="grid gap-2">
                  {ventasAConfirmar.map(({ etiqueta, venta }) =>
                    yaEstaCobrada(venta) ? (
                      <p
                        key={venta.ventaId}
                        className="text-sm font-medium text-green-700"
                      >
                        {etiqueta}: cobrada
                      </p>
                    ) : (
                      <Button
                        key={venta.ventaId}
                        onClick={() =>
                          setCobrandoConTarjeta({
                            ventaId: venta.ventaId,
                            etiqueta,
                          })
                        }
                        className="w-full"
                        size="sm"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        {ventasAConfirmar.length > 1
                          ? `Cobrar ${etiqueta} con tarjeta`
                          : 'Cobrar con tarjeta'}
                      </Button>
                    ),
                  )}
                </div>
              )}

              {!todoCobrado && !conTarjeta && (
                <Button
                  onClick={handleConfirmPayment}
                  className="w-full"
                  size="sm"
                  disabled={!(conQueSeCobro || metodoPago) || cobrando}
                >
                  {cobrando ? 'Registrando cobro...' : 'Confirmar cobro'}
                </Button>
              )}

              {todoCobrado && (
                <>
                  <Separator />
                  <p className="text-sm font-medium text-green-700">
                    Cobro registrado. Falta entregarle los documentos.
                  </p>

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
      <ModalDeBancard
        ventaId={cobrandoConTarjeta?.ventaId ?? null}
        titulo={
          ventasAConfirmar.length > 1 ? cobrandoConTarjeta?.etiqueta : undefined
        }
        abierto={cobrandoConTarjeta !== null}
        onClose={() => setCobrandoConTarjeta(null)}
        onError={(mensaje) => setErrorPago(mensaje)}
      />
    </div>
  )
}