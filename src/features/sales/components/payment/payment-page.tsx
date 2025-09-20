import { useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, MapPin, Calendar, Clock, Bus, CreditCard, CheckCircle } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

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

  const asientos = search.asientosIds.split(',').map((id, index) => ({
    numero: id,
    precio: parseFloat(search.precios.split(',')[index]),
    tipo: search.tipos.split(',')[index],
    piso: parseInt(search.pisos.split(',')[index])
  }))

  const totalAsientos = asientos.reduce((total, asiento) => total + asiento.precio, 0)
  const comisionTotal = parseFloat(search.comisionTotal)
  const totalFinal = totalAsientos + comisionTotal

  const handleGoBack = () => {
    navigate({ to: '/sales' })
  }

  const handleProceedToPayment = () => {
    // TODO: Implementar integración con sistema de pago
    //console.log('Proceder al pago...')
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
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
                <div className="flex flex-wrap gap-2">
                  {asientos.map((asiento, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      Asiento {asiento.numero} - {asiento.tipo} - Piso {asiento.piso}
                    </Badge>
                  ))}
                </div>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm font-medium">ID de Venta</p>
                  <p className="text-xs text-muted-foreground font-mono">{search.ventaId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Número de Transacción</p>
                  <p className="text-xs text-muted-foreground font-mono">{search.numeroTransaccion}</p>
                </div>
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
                {asientos.map((asiento, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>Asiento {asiento.numero}</span>
                    <span>₲ {asiento.precio.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₲ {totalAsientos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Comisión</span>
                  <span>₲ {comisionTotal.toLocaleString()}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₲ {totalFinal.toLocaleString()}</span>
              </div>

              <Button 
                onClick={handleProceedToPayment}
                className="w-full"
                size="sm"
              >
                Proceder al Pago
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
