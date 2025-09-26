import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Info, CheckCircle, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SeatGrid } from './seat-grid'
import { ServiceInfo } from './service-info'
import { SeatLegend } from './seat-legend'
import { useGetAsientos } from '../../hooks/use-get-asientos'
import { useBloquearAsientos } from '../../hooks/use-bloquear-asientos'
import { useLiberarBloqueo } from '../../hooks/use-liberar-bloqueo'
import { useRoundTrip } from '../../context/round-trip-context'
import type { Asiento, ConsultarAsientosRequest } from '../../models/sales.model'

interface SeatSelectionPageProps {
  tripType?: 'ida' | 'vuelta'
  onComplete?: (servicio: unknown, asientos: Asiento[], codigoReferencia: string) => void
}

export function RoundTripSeatSelectionPage({ tripType = 'ida', onComplete: _onComplete }: SeatSelectionPageProps) {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()
  const [selectedSeats, setSelectedSeats] = useState<Asiento[]>([])
  const [blockedSeats, setBlockedSeats] = useState<Asiento[]>([])
  const [blockReferenceCode, setBlockReferenceCode] = useState<string | null>(null)
  const [isBlockingSeats, setIsBlockingSeats] = useState(false)

  // Determinar qué datos usar según el tipo de viaje
  const currentTripData = tripType === 'ida' ? roundTripData.ida : roundTripData.vuelta

  useEffect(() => {
    // Si ya hay asientos bloqueados para este viaje, restaurarlos
    if (currentTripData?.asientos && currentTripData?.codigoReferencia) {
      setBlockedSeats(currentTripData.asientos)
      setBlockReferenceCode(currentTripData.codigoReferencia)
    }
  }, [currentTripData])

  const consultarAsientosRequest: ConsultarAsientosRequest | null = currentTripData?.servicio && currentTripData?.empresaId ? {
    servicioId: currentTripData.servicio.Id,
    origenId: currentTripData.origen!.id,
    destinoId: currentTripData.destino!.id,
    empresaId: currentTripData.empresaId, // Usar el UUID de la empresa del contexto
  } : null

  const { data: asientosData, isLoading, error } = useGetAsientos(consultarAsientosRequest)
  const bloquearAsientosMutation = useBloquearAsientos()
  const liberarBloqueoMutation = useLiberarBloqueo()

  const handleSeatSelect = (asiento: Asiento) => {
    // Si ya hay asientos bloqueados, no permitir cambios
    if (blockedSeats.length > 0) {
      return
    }

    setSelectedSeats(prev => {
      // Si el asiento ya está seleccionado, lo removemos
      if (prev.some(seat => seat.numero === asiento.numero)) {
        return prev.filter(seat => seat.numero !== asiento.numero)
      }
      
      // Si ya tenemos 2 asientos seleccionados, no permitimos más
      if (prev.length >= 2) {
        return prev
      }
      
      // Agregamos el nuevo asiento
      return [...prev, asiento]
    })
  }

  const handleConfirmSelection = async () => {
    if (selectedSeats.length > 0 && currentTripData?.servicio && !blockedSeats.length) {
      setIsBlockingSeats(true)
      
      try {
        const result = await bloquearAsientosMutation.mutateAsync({
          servicioId: currentTripData.servicio.Id,
          origenId: currentTripData.origen!.id,
          destinoId: currentTripData.destino!.id,
          empresaId: currentTripData.empresaId!, // Usar el UUID de la empresa del contexto
          asientos: selectedSeats.map(seat => seat.numero),
        })

        if (result.exitoso) {
          setBlockedSeats(selectedSeats)
          setBlockReferenceCode(result.codigoReferencia)
          setSelectedSeats([])

          // Guardar en el contexto
          const updatedTripData = {
            ...currentTripData,
            asientos: selectedSeats,
            codigoReferencia: result.codigoReferencia
          }

          if (tripType === 'ida') {
            setRoundTripData({ ida: updatedTripData })
          } else {
            setRoundTripData({ vuelta: updatedTripData })
          }
        }
      } catch (_error) {
        // TODO: Show error message to user
      } finally {
        setIsBlockingSeats(false)
      }
    }
  }

  const handleReleaseSeats = async () => {
    if (blockReferenceCode) {
      try {
        await liberarBloqueoMutation.mutateAsync(blockReferenceCode)
        setBlockedSeats([])
        setBlockReferenceCode(null)
        
        // Limpiar del contexto también
        if (tripType === 'ida') {
          setRoundTripData({ 
            ida: { 
              ...currentTripData, 
              asientos: undefined, 
              codigoReferencia: undefined 
            } 
          })
        } else {
          setRoundTripData({ 
            vuelta: { 
              ...currentTripData, 
              asientos: undefined, 
              codigoReferencia: undefined 
            } 
          })
        }
      } catch (_error) {
        // TODO: Show error message to user
      }
    }
  }

  const handleGoBack = async () => {
    // Si hay asientos bloqueados, liberarlos antes de volver
    if (blockReferenceCode) {
      await handleReleaseSeats()
    }
    
    // Si es vuelta, volver a servicios de vuelta; si es ida, volver a búsqueda
    if (tripType === 'vuelta') {
      setCurrentStep('servicios-vuelta')
    } else {
      setCurrentStep('search')
    }
  }

  const handleContinueToCheckout = () => {
    if (blockedSeats.length > 0 && currentTripData) {
      // Si es ida y hay vuelta, ir a selección de servicios de vuelta primero
      if (tripType === 'ida' && roundTripData.vuelta?.fecha) {
        setCurrentStep('servicios-vuelta')
      } else {
        // Ir a checkout
        setCurrentStep('checkout')
      }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
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
        {asientosData && (
          <Badge variant="secondary" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {asientosData.totalDisponibles} disponibles
          </Badge>
        )}
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

            {/* Selected Seats Info */}
            {(selectedSeats.length > 0 || blockedSeats.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {blockedSeats.length > 0 ? (
                      <>
                        <Lock className="h-4 w-4 text-blue-600" />
                        Asientos Confirmados ({blockedSeats.length}/2)
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Asientos Seleccionados ({selectedSeats.length}/2)
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(blockedSeats.length > 0 ? blockedSeats : selectedSeats).map((seat, _index) => (
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
                            {new Intl.NumberFormat('es-PY', {
                              style: 'currency',
                              currency: 'PYG',
                              minimumFractionDigits: 0,
                            }).format(seat.precio)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Subtotal</span>
                        <span className="text-sm font-medium">
                          {new Intl.NumberFormat('es-PY', {
                            style: 'currency',
                            currency: 'PYG',
                            minimumFractionDigits: 0,
                          }).format((blockedSeats.length > 0 ? blockedSeats : selectedSeats).reduce((total, seat) => total + seat.precio, 0))}
                        </span>
                      </div>
                      {/* Service charge removed for now - will be handled at checkout level */}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-lg font-bold">
                          {new Intl.NumberFormat('es-PY', {
                            style: 'currency',
                            currency: 'PYG',
                            minimumFractionDigits: 0,
                          }).format(
                            (blockedSeats.length > 0 ? blockedSeats : selectedSeats).reduce((total, seat) => total + seat.precio, 0)
                          )}
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
                  disabled={selectedSeats.length === 0 || isBlockingSeats}
                  className="w-full"
                  size="lg"
                >
                  {isBlockingSeats ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Confirmando asientos...
                    </>
                  ) : selectedSeats.length > 0 ? (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Confirmar asientos ({selectedSeats.length})
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
