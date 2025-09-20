import { useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, MapPin, Calendar, Clock, Bus, CreditCard, CheckCircle } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useActualizarEstadoPago } from '@/features/sales/hooks/use-actualizar-estado-pago'
import { downloadInvoice, downloadBlobAsFile } from '@/features/dashboard/services/invoice.service'
import { toast } from 'sonner'

interface PaymentSearch {
  servicioId: string
  origenId: string
  destinoId: string
  empresaId: string
  empresa: string
  origen: string
  destino: string
  fecha: string
  hora: string
  serviceCharge: string
  asientosIds: string
  precios: string
  tipos: string
  pisos: string
  codigoReferencia: string
  empresaBoleto: string
  calidad: string
  ventaId: string
  numeroTransaccion: string
  estado: string
  mensaje: string
  comisionTotal: string
}

export function PaymentPage() {
  const search = useSearch({ from: '/_authenticated/sales/payment' }) as PaymentSearch
  const navigate = useNavigate()
  const actualizarEstadoPagoMutation = useActualizarEstadoPago()

  const [metodoPago, setMetodoPago] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false)
  const [isPaid, setIsPaid] = useState(search.estado === 'PAGADO')

  // Validar que los parámetros necesarios existan y sean strings
  // Procesar datos de asientos de manera robusta
  const asientosIds = String(search.asientosIds || '')
  const precios = String(search.precios || '')
  const tipos = String(search.tipos || '')
  const pisos = String(search.pisos || '')

  // Procesar asientos - manejar tanto casos de un asiento como múltiples
  const asientos: Array<{numero: string, precio: number, tipo: string, piso: number}> = []
  if (asientosIds && asientosIds.trim()) {
    const idsArray = asientosIds.split(',').filter(id => id.trim())
    const preciosArray = precios.split(',')
    const tiposArray = tipos.split(',')
    const pisosArray = pisos.split(',')
    
    idsArray.forEach((id, index) => {
      asientos.push({
        numero: id.trim(),
        precio: parseFloat(preciosArray[index] || precios || '0'),
        tipo: tiposArray[index] || tipos || '',
        piso: parseInt(pisosArray[index] || pisos || '0')
      })
    })
  }

  const totalAsientos = asientos.reduce((total, asiento) => total + asiento.precio, 0)
  
  // Calcular cargo por servicio basado en el porcentaje de la empresa
  const serviceChargePercentage = parseFloat(String(search.serviceCharge || '0'))
  const cargoPorServicio = (totalAsientos * serviceChargePercentage) / 100
  
  const totalFinal = totalAsientos + cargoPorServicio

  // Validar que tengamos los datos mínimos necesarios
  const ventaId = typeof search.ventaId === 'string' ? search.ventaId : ''
  const numeroTransaccion = typeof search.numeroTransaccion === 'string' ? search.numeroTransaccion : ''
  
  if (!ventaId || !numeroTransaccion) {
    return (
      <div className="w-full p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error de Datos</h2>
            <p className="text-muted-foreground mb-4">
              No se encontraron los datos necesarios para mostrar la página de pago.
            </p>
            <Button onClick={() => navigate({ to: '/sales' })}>
              Volver a Ventas
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleGoBack = () => {
    navigate({ to: '/sales' })
  }

  const handleDownloadInvoice = async () => {
    if (!numeroTransaccion) {
      toast.error('No se encontró el número de transacción')
      return
    }

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
      const response = await actualizarEstadoPagoMutation.mutateAsync({
        ventaId: ventaId,
        data: {
          estadoPago: 'PAGADO',
          metodoPago: metodoPago,
          observaciones: observaciones || undefined
        }
      })

      toast.success('Pago confirmado exitosamente', {
        description: `Estado actualizado: ${response.estadoAnterior} → ${response.estadoNuevo}`,
        duration: 5000,
      })

      // Actualizar estado para mostrar botón de descarga de factura
      setIsPaid(true)

    } catch (error) {
      toast.error('Error al confirmar el pago', {
        description: error instanceof Error ? error.message : 'Error desconocido'
      })
    } finally {
      setIsProcessingPayment(false)
    }
  }

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
        {/* Resumen del Viaje */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bus className="h-4 w-4" />
                Resumen del Viaje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="font-medium">{search.origen}</p>
                  <p className="text-sm text-muted-foreground">Origen</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-red-600" />
                <div>
                  <p className="font-medium">{search.destino}</p>
                  <p className="text-sm text-muted-foreground">Destino</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{search.fecha}</p>
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

              <div className="space-y-2">
                <p className="text-sm font-medium">Asientos Seleccionados:</p>
                {asientos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {asientos.map((asiento, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        Asiento {asiento.numero} - {asiento.tipo} - Piso {asiento.piso}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No se encontraron asientos seleccionados</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Información de la Venta */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Información de la Reserva
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium">Número de Transacción</p>
                <p className="text-xs text-muted-foreground font-mono">{numeroTransaccion}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Estado</p>
                <Badge variant="outline" className="text-xs">
                  {search.estado}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium">Mensaje</p>
                <p className="text-xs text-muted-foreground">{search.mensaje}</p>
              </div>
            </CardContent>
          </Card>
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
                {asientos.length > 0 ? (
                  asientos.map((asiento, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>Asiento {asiento.numero}</span>
                      <span>₲ {asiento.precio.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-sm">
                    <span>Asientos</span>
                    <span>₲ 0</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₲ {totalAsientos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cargo por Servicio ({serviceChargePercentage}%)</span>
                  <span>₲ {cargoPorServicio.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₲ {totalFinal.toLocaleString()}</span>
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
                      <SelectItem value="TARJETA_CREDITO">Tarjeta de Crédito</SelectItem>
                      <SelectItem value="TARJETA_DEBITO">Tarjeta de Débito</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="BANCARD">Bancard</SelectItem>
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

                {/* Botón de descarga de factura - solo visible cuando está pagado */}
                {isPaid && (
                  <Button 
                    onClick={handleDownloadInvoice}
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled={isDownloadingInvoice}
                  >
                    {isDownloadingInvoice ? 'Descargando...' : 'Descargar Factura'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
