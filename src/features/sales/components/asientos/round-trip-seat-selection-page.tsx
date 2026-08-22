import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Users, Info, CheckCircle, Lock, Unlock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SeatGrid } from './seat-grid'
import { ServiceInfo } from './service-info'
import { SeatLegend } from './seat-legend'
import { TiempoBloqueo } from './tiempo-bloqueo'
import { useGetAsientos } from '../../hooks/use-get-asientos'
import { useBloquearAsientos } from '../../hooks/use-bloquear-asientos'
import { useLiberarBloqueo } from '../../hooks/use-liberar-bloqueo'
import { useRoundTrip } from '../../context/round-trip-context'
import {
  calcularCargoServicio,
  formatearGuaranies,
  sumarPreciosAsientos,
  describirCargoServicio,
} from '../../utils/money'
import type { Asiento, ConsultarAsientosRequest } from '../../models/sales.model'
import { toast } from 'sonner'

const MAX_ASIENTOS_POR_TRAMO = 2

interface SeatSelectionPageProps {
  tripType?: 'ida' | 'vuelta'
  onComplete?: (servicio: unknown, asientos: Asiento[], codigoReferencia: string) => void
}

export function RoundTripSeatSelectionPage({ tripType = 'ida', onComplete: _onComplete }: SeatSelectionPageProps) {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()
  const [selectedSeats, setSelectedSeats] = useState<Asiento[]>([])
  const [errorBloqueo, setErrorBloqueo] = useState<string | null>(null)
  const [bloqueoVencido, setBloqueoVencido] = useState(false)

  /**
   * Guarda contra doble envío del bloqueo.
   *
   * Es un `ref` porque tiene que cerrarse de forma síncrona: dos clicks
   * seguidos se despachan antes de que React vuelva a renderizar. Se reabre
   * sólo si el bloqueo falló o si se liberaron los asientos.
   */
  const bloqueoCerrado = useRef(false)

  const currentTripData = tripType === 'ida' ? roundTripData.ida : roundTripData.vuelta

  // Los asientos bloqueados y su código viven en el contexto: son la única
  // fuente de verdad. Antes había un estado local paralelo que se desincronizaba.
  const blockedSeats = currentTripData?.asientos ?? []
  const blockReferenceCode = currentTripData?.codigoReferencia ?? null

  const consultarAsientosRequest: ConsultarAsientosRequest | null = currentTripData?.servicio && currentTripData?.agenciaId && currentTripData?.origen && currentTripData?.destino ? {
    servicioId: currentTripData.servicio.Id,
    origenId: currentTripData.origen.id,
    destinoId: currentTripData.destino.id,
    agenciaId: currentTripData.agenciaId,
  } : null

  const { data: asientosData, isLoading, error } = useGetAsientos(consultarAsientosRequest)
  const bloquearAsientosMutation = useBloquearAsientos()
  const liberarBloqueoMutation = useLiberarBloqueo()

  const guardarTramo = useCallback(
    (cambios: Partial<NonNullable<typeof currentTripData>>) => {
      const actualizado = { ...currentTripData, ...cambios }
      if (tripType === 'ida') {
        setRoundTripData({ ida: actualizado })
      } else {
        setRoundTripData({ vuelta: actualizado })
      }
    },
    [currentTripData, setRoundTripData, tripType],
  )

  useEffect(() => {
    setBloqueoVencido(false)
  }, [blockReferenceCode])

  const handleSeatSelect = (asiento: Asiento) => {
    if (blockedSeats.length > 0) return

    setErrorBloqueo(null)
    setSelectedSeats(prev => {
      if (prev.some(seat => seat.numero === asiento.numero)) {
        return prev.filter(seat => seat.numero !== asiento.numero)
      }

      if (prev.length >= MAX_ASIENTOS_POR_TRAMO) {
        return prev
      }

      return [...prev, asiento]
    })
  }

  /**
   * Bloquea los asientos seleccionados.
   *
   * El service lanza si el bloqueo falló o quedó incompleto, así que llegar a
   * la línea siguiente significa que los asientos están reservados de verdad.
   * Antes esto avanzaba con `result.exitoso` sin comparar qué asientos
   * devolvió el backend: con un bloqueo parcial el checkout confirmaba una
   * venta por asientos que nunca se reservaron.
   */
  const handleConfirmSelection = async () => {
    if (bloqueoCerrado.current) return
    if (selectedSeats.length === 0 || !currentTripData?.servicio || blockedSeats.length > 0) return

    bloqueoCerrado.current = true
    setErrorBloqueo(null)

    try {
      const result = await bloquearAsientosMutation.mutateAsync({
        servicioId: currentTripData.servicio.Id,
        origenId: currentTripData.origen!.id,
        destinoId: currentTripData.destino!.id,
        agenciaId: currentTripData.agenciaId!,
        asientos: selectedSeats.map(seat => seat.numero),
      })

      guardarTramo({
        asientos: selectedSeats,
        codigoReferencia: result.codigoReferencia,
        bloqueoExpiraEn: result.tiempoExpiracion,
      })
      setSelectedSeats([])

      toast.success('Asientos reservados', {
        description: `${result.asientosBloqueados.length} asiento(s) bloqueado(s) por 30 minutos.`,
        duration: 4000,
      })
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : 'No se pudieron bloquear los asientos.'

      setErrorBloqueo(mensaje)
      toast.error('No se pudieron reservar los asientos', {
        description: mensaje,
        duration: 8000,
      })

      // Falló: el operador puede elegir otros asientos y reintentar.
      bloqueoCerrado.current = false
    }
  }

  const handleReleaseSeats = async () => {
    if (!blockReferenceCode || liberarBloqueoMutation.isPending) return

    try {
      await liberarBloqueoMutation.mutateAsync(blockReferenceCode)
      guardarTramo({
        asientos: undefined,
        codigoReferencia: undefined,
        bloqueoExpiraEn: undefined,
      })
      setSelectedSeats([])
      // Sin bloqueo activo se puede volver a reservar.
      bloqueoCerrado.current = false
      toast.success('Asientos liberados')
    } catch (error) {
      toast.error('No se pudieron liberar los asientos', {
        description:
          error instanceof Error
            ? error.message
            : 'Reintentá o esperá a que expire el bloqueo.',
        duration: 8000,
      })
    }
  }

  const handleGoBack = async () => {
    // Volver atrás abandona este tramo: los asientos tienen que quedar libres.
    if (blockReferenceCode) {
      await handleReleaseSeats()
    }

    if (tripType === 'vuelta') {
      setCurrentStep('servicios-vuelta')
    } else {
      setCurrentStep('search')
    }
  }

  const handleBloqueoVencido = useCallback(() => {
    setBloqueoVencido(true)
    toast.warning('El bloqueo de asientos venció', {
      description: 'Volvé a seleccionar los asientos antes de continuar.',
      duration: 10000,
    })
  }, [])

  const handleContinueToCheckout = () => {
    if (blockedSeats.length === 0 || !currentTripData || bloqueoVencido) return

    if (tripType === 'ida' && roundTripData.vuelta?.fecha) {
      setCurrentStep('servicios-vuelta')
    } else {
      setCurrentStep('checkout')
    }
  }

  if (!currentTripData?.servicio) {
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No se encontró información del servicio. Por favor, selecciona un servicio desde la página anterior.
          </AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Servicios
        </Button>
      </div>
    )
  }

  const asientosVisibles = blockedSeats.length > 0 ? blockedSeats : selectedSeats
  const importePasajes = sumarPreciosAsientos(asientosVisibles)
  const cargoServicio = calcularCargoServicio(importePasajes, currentTripData.serviceCharge)
  const totalTramo = importePasajes + cargoServicio
  const bloqueando = bloquearAsientosMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoBack} disabled={liberarBloqueoMutation.isPending}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Selección de Asientos - {tripType === 'ida' ? 'Viaje de Ida' : 'Viaje de Vuelta'}
            </h1>
            <p className="text-muted-foreground">
              {currentTripData.origen?.nombre} → {currentTripData.destino?.nombre} • {currentTripData.fecha?.toISOString().split('T')[0]} {currentTripData.servicio.Embarque}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TiempoBloqueo
            expiraEn={currentTripData.bloqueoExpiraEn}
            onExpirado={handleBloqueoVencido}
          />
          {asientosData && (
            <Badge variant="secondary" className="text-sm">
              <Users className="h-4 w-4 mr-1" />
              {asientosData.totalDisponibles} disponibles
            </Badge>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando asientos disponibles...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive mb-2">Error al cargar asientos</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={handleGoBack} variant="outline" className="mt-4">
              Volver a Servicios
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Seat Selection */}
      {asientosData && !isLoading && !error && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Seat Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Asientos Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SeatGrid
                  asientos={asientosData.asientos}
                  onSeatSelect={handleSeatSelect}
                  selectedSeats={selectedSeats}
                  blockedSeats={blockedSeats}
                  configuracionBus={asientosData.configuracionBus}
                />
                <div className="mt-6">
                  <SeatLegend />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Service Info */}
            <ServiceInfo
              servicioInfo={asientosData.servicioInfo}
              empresaNombre={currentTripData.servicio.Emp}
              serviceCharge={undefined}
            />

            {/* El bloqueo falló: el operador tiene que enterarse acá, no en el
                checkout ni después de que el cliente pagó. */}
            {errorBloqueo && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorBloqueo}</AlertDescription>
              </Alert>
            )}

            {bloqueoVencido && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  El bloqueo de asientos venció. Liberá la reserva y volvé a
                  seleccionar los asientos.
                </AlertDescription>
              </Alert>
            )}

            {/* Selected Seats Info */}
            {asientosVisibles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {blockedSeats.length > 0 ? (
                      <>
                        <Lock className="h-4 w-4 text-blue-600" />
                        Asientos Reservados ({blockedSeats.length}/{MAX_ASIENTOS_POR_TRAMO})
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Asientos Seleccionados ({selectedSeats.length}/{MAX_ASIENTOS_POR_TRAMO})
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {asientosVisibles.map((seat) => (
                      <div key={seat.numero} className={`flex items-center justify-between p-3 rounded-lg border ${
                        blockedSeats.length > 0
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-base text-gray-900">Asiento {seat.numero}</span>
                            <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-300">Piso {seat.piso}</Badge>
                            {blockedSeats.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="h-3 w-3 mr-1" />
                                Bloqueado
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{seat.calidad}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">
                            {formatearGuaranies(seat.precio)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pasajes</span>
                        <span className="text-sm font-medium">
                          {formatearGuaranies(importePasajes)}
                        </span>
                      </div>
                      {cargoServicio > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {describirCargoServicio(currentTripData.serviceCharge)}
                          </span>
                          <span className="text-sm font-medium">
                            {formatearGuaranies(cargoServicio)}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total del tramo</span>
                        <span className="text-lg font-bold">
                          {formatearGuaranies(totalTramo)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {blockedSeats.length > 0 ? (
                <>
                  <Button
                    onClick={handleContinueToCheckout}
                    className="w-full"
                    size="lg"
                    disabled={bloqueoVencido}
                  >
                    {tripType === 'ida' && roundTripData.vuelta?.fecha
                      ? 'Continuar a Vuelta'
                      : 'Continuar al Checkout'
                    }
                  </Button>
                  <Button
                    onClick={handleReleaseSeats}
                    variant="outline"
                    className="w-full"
                    disabled={liberarBloqueoMutation.isPending}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    {liberarBloqueoMutation.isPending ? 'Liberando...' : 'Liberar Asientos'}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleConfirmSelection}
                  disabled={selectedSeats.length === 0 || bloqueando}
                  className="w-full"
                  size="lg"
                >
                  {bloqueando ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Reservando asientos con la empresa...
                    </>
                  ) : selectedSeats.length > 0 ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Reservar asientos ({selectedSeats.length})
                    </>
                  ) : (
                    'Selecciona al menos un asiento'
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
