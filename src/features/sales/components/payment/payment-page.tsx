import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, MapPin, Calendar, Clock, Bus, CheckCircle, Download, AlertTriangle } from 'lucide-react'
import { useActualizarEstadoPago } from '@/features/sales/hooks/use-actualizar-estado-pago'
import { ResumenPago } from '../pago/resumen-pago'
import { deserializarServiceCharge } from '../../utils/service-charge-url'
import { downloadInvoice, downloadBlobAsFile } from '@/features/dashboard/services/invoice.service'
import type { Asiento, ServiceCharge } from '../../models/sales.model'
import { toast } from 'sonner'
import {
  ETIQUETAS_METODO_PAGO,
  OPCIONES_METODO_PAGO,
  type MetodoPago,
} from '@/lib/metodo-pago'
import { BancardCheckout } from './bancard-checkout'

interface PaymentSearch {
  empresa: string
  origen: string
  destino: string
  fecha: string
  hora: string
  ventaId: string
  numeroTransaccion: string
  estado: string
  mensaje: string
  /** Con qué se cobró. Se eligió al vender: acá sólo se muestra. */
  metodoPago: string
  /** `PAGADO` cuando nació cobrada, que es lo que pasa en efectivo. */
  estadoPago: string
}

/**
 * Los parámetros se leen del `window.location` y no de `useSearch`.
 *
 * La ruta `/sales/payment` no declara `validateSearch`, así que el parser por
 * defecto de TanStack Router convierte los valores: `precios=150000` volvía
 * como número y `precios=150000,150000` como string. De ahí venían los
 * `String(...)` y `parseFloat` defensivos repartidos por toda la pantalla.
 */
function leerParametros(): {
  search: PaymentSearch
  asientos: Asiento[]
  serviceCharge?: ServiceCharge
} {
  const params = new URLSearchParams(window.location.search)

  const separar = (clave: string) =>
    (params.get(clave) || '')
      .split(',')
      .map((valor) => valor.trim())
      .filter(Boolean)

  const numeros = separar('asientosIds')
  const precios = separar('precios')
  const tipos = separar('tipos')
  const pisos = separar('pisos')

  const asientos: Asiento[] = numeros.map((numero, index) => ({
    numero,
    disponible: false,
    precio: Number(precios[index] ?? 0) || 0,
    tipo: (tipos[index] as Asiento['tipo']) ?? 'CENTRO',
    piso: Number(pisos[index] ?? 1) || 1,
    calidad: 'Estándar',
  }))

  return {
    search: {
      empresa: params.get('empresa') || '',
      origen: params.get('origen') || '',
      destino: params.get('destino') || '',
      fecha: params.get('fecha') || '',
      hora: params.get('hora') || '',
      ventaId: params.get('ventaId') || '',
      numeroTransaccion: params.get('numeroTransaccion') || '',
      estado: params.get('estado') || '',
      metodoPago: params.get('metodoPago') || '',
      estadoPago: params.get('estadoPago') || '',
      mensaje: params.get('mensaje') || '',
    },
    asientos,
    serviceCharge: deserializarServiceCharge(params),
  }
}

export function PaymentPage() {
  const navigate = useNavigate()
  const actualizarEstadoPagoMutation = useActualizarEstadoPago()

  const [datos, setDatos] = useState<ReturnType<typeof leerParametros> | null>(null)
  const [metodoPago, setMetodoPago] = useState('')

  /**
   * Con qué se cobró. Viene de la venta, que nació con ese dato al elegirlo en
   * el checkout. Preguntarlo otra vez acá dejaba cambiarlo después de hecha la
   * venta, y la caja terminaba diciendo algo distinto de lo que pasó.
   */
  const conQueSeCobro = datos?.search.metodoPago || ''

  /**
   * La venta nació cobrada. Pasa con efectivo: la plata está sobre el
   * mostrador y no hay nada que registrar después. Intentarlo fallaba con
   * «Transición de estado no válida: PAGADO → PAGADO».
   */
  const nacioPagada = datos?.search.estadoPago === 'PAGADO'

  // Con tarjeta no se registra el cobro a mano: lo confirma el callback de
  // Bancard. El vendedor abre el formulario y el cliente escribe ahí.
  const conTarjeta = (conQueSeCobro || metodoPago) === 'BANCARD'
  const [bancardAbierto, setBancardAbierto] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false)
  const [cobroRegistrado, setCobroRegistrado] = useState(false)

  /** Cobrada: nació así —efectivo— o se registró en esta pantalla. */
  const isPaid = nacioPagada || cobroRegistrado
  const [errorPago, setErrorPago] = useState<string | null>(null)

  /**
   * Guarda contra doble envío: marcar PAGADO dispara la emisión del boleto.
   *
   * Es un `ref` porque tiene que cerrarse de forma síncrona: dos clicks
   * seguidos se despachan antes de que React vuelva a renderizar. Se reabre
   * sólo si el cobro falló.
   */
  const cobroCerrado = useRef(false)

  useEffect(() => {
    const leidos = leerParametros()
    setDatos(leidos)
    // Ya está cobrada: lo dice `estadoPago`, que viene del checkout. El
    // `estado` de acá es el de la VENTA (CONFIRMADO/CANCELADO), no el del pago.
    setCobroRegistrado(leidos.search.estadoPago === 'PAGADO')
  }, [])

  const handleGoBack = () => {
    navigate({ to: '/sales' })
  }

  if (!datos) return null

  const { search, asientos, serviceCharge } = datos

  if (!search.ventaId || !search.numeroTransaccion) {
    return (
      <div className="w-full p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error de Datos</h2>
            <p className="text-muted-foreground mb-4">
              No se encontraron los datos necesarios para mostrar la página de pago.
            </p>
            <Button onClick={handleGoBack}>Volver a Ventas</Button>
          </div>
        </div>
      </div>
    )
  }

  const handleDownloadInvoice = async () => {
    if (isDownloadingInvoice) return
    setIsDownloadingInvoice(true)

    try {
      const invoiceResponse = await downloadInvoice(search.numeroTransaccion)
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
   * Registra el cobro.
   *
   * El éxito lo decide el backend: el service lanza si no confirma el cambio
   * de estado. Antes se mostraba "Pago confirmado exitosamente" apenas la
   * promesa resolvía, y con el backend viejo (200 + `success: false`) eso era
   * siempre.
   */
  const handleConfirmPayment = async () => {
    if (cobroCerrado.current) return

    // Ya está cobrada: no hay nada que registrar.
    if (nacioPagada) return

    const conQue = conQueSeCobro || metodoPago

    if (!conQue) {
      toast.error('Por favor selecciona un método de pago')
      return
    }

    cobroCerrado.current = true
    setErrorPago(null)

    try {
      const response = await actualizarEstadoPagoMutation.mutateAsync({
        ventaId: search.ventaId,
        data: {
          estadoPago: 'PAGADO',
          metodoPago: conQue,
          observaciones: observaciones || undefined,
        },
      })

      setCobroRegistrado(true)
      toast.success('Cobro registrado', {
        description: `Estado actualizado: ${response.estadoAnterior} → ${response.estadoNuevo}`,
        duration: 6000,
      })
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : 'Error desconocido'
      setErrorPago(mensaje)
      toast.error('No se pudo registrar el cobro', {
        description: mensaje,
        duration: 10000,
      })

      // Falló: se puede reintentar.
      cobroCerrado.current = false
    }
  }

  const cobrando = actualizarEstadoPagoMutation.isPending

  return (
    <div className="w-full p-4">
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
        {/* Resumen del Viaje */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bus className="h-3 w-3" />
                Resumen del Viaje
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-blue-600" />
                  <span className="text-sm font-medium">{search.origen}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-red-600" />
                  <span className="text-sm font-medium">{search.destino}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{search.fecha}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{search.hora}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Asientos:</p>
                {asientos.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {asientos.map((asiento) => (
                      <Badge key={asiento.numero} variant="secondary" className="text-xs px-2 py-0">
                        {asiento.numero} - {asiento.tipo}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No se encontraron asientos</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                Estado de la Reserva
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Transacción {search.numeroTransaccion}
                </span>
                <Badge variant={isPaid ? 'default' : 'outline'} className="text-xs">
                  {isPaid ? 'PAGADO' : search.estado}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{search.mensaje}</p>
            </CardContent>
          </Card>
        </div>

        {/* Resumen de Pago */}
        <div className="space-y-4">
          <ResumenPago
            tramos={[{ etiqueta: 'Viaje', asientos, serviceCharge }]}
            titulo="Total a cobrar"
          />

          <Card>
            <CardContent className="pt-6 space-y-3">
              {errorPago && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{errorPago}</AlertDescription>
                </Alert>
              )}

              {/* El método ya se eligió al vender: acá sólo se muestra. */}
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
                <Select value={metodoPago} onValueChange={setMetodoPago} disabled={isPaid}>
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
                  disabled={isPaid}
                />
              </div>

              {!isPaid && conTarjeta && !bancardAbierto && (
                <Button
                  onClick={() => setBancardAbierto(true)}
                  className="w-full"
                  size="sm"
                >
                  Abrir el pago con tarjeta
                </Button>
              )}

              {!isPaid && conTarjeta && bancardAbierto && (
                <BancardCheckout
                  ventaId={search.ventaId}
                  onError={(mensaje) => setErrorPago(mensaje)}
                />
              )}

              {!isPaid && !conTarjeta ? (
                <Button
                  onClick={handleConfirmPayment}
                  className="w-full"
                  size="sm"
                  disabled={!metodoPago || cobrando}
                >
                  {cobrando ? 'Registrando cobro...' : 'Confirmar cobro'}
                </Button>
              ) : null}

              {isPaid && (
                <>
                  <Separator />
                  <p className="text-sm font-medium text-green-700">
                    Cobro registrado. Ya podés descargar la factura.
                  </p>
                  <Button
                    onClick={handleDownloadInvoice}
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled={isDownloadingInvoice}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isDownloadingInvoice ? 'Descargando...' : 'Descargar Factura'}
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
