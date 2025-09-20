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
import type { Asiento, ConsultarAsientosRequest } from '../../models/sales.model'

interface SeatSelectionSearch {
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
  codigoReferencia?: string
  asientosBloqueados?: string
  preciosBloqueados?: string
  tiposBloqueados?: string
  pisosBloqueados?: string
  empresaBoleto?: string // Emp del servicio
  calidad?: string // Calidad del servicio
}

export function SeatSelectionPage() {
  const [search, setSearch] = useState<SeatSelectionSearch | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<Asiento[]>([])
  const [blockedSeats, setBlockedSeats] = useState<Asiento[]>([])
  const [blockReferenceCode, setBlockReferenceCode] = useState<string | null>(null)
  const [isBlockingSeats, setIsBlockingSeats] = useState(false)

  useEffect(() => {
    // Get search parameters from URL
    const urlParams = new URLSearchParams(window.location.search)
    const searchData: SeatSelectionSearch = {
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
      codigoReferencia: urlParams.get('codigoReferencia') || undefined,
      asientosBloqueados: urlParams.get('asientosBloqueados') || undefined,
      preciosBloqueados: urlParams.get('preciosBloqueados') || undefined,
      tiposBloqueados: urlParams.get('tiposBloqueados') || undefined,
      pisosBloqueados: urlParams.get('pisosBloqueados') || undefined,
      empresaBoleto: urlParams.get('empresaBoleto') || undefined,
      calidad: urlParams.get('calidad') || undefined,
    }
    setSearch(searchData)

    // Si hay asientos bloqueados en la URL, restaurarlos
    if (searchData.asientosBloqueados && searchData.preciosBloqueados && 
        searchData.tiposBloqueados && searchData.pisosBloqueados) {
      const asientosIds = searchData.asientosBloqueados.split(',')
      const precios = searchData.preciosBloqueados.split(',').map(Number)
      const tipos = searchData.tiposBloqueados.split(',') as ('VENTANA' | 'PASILLO' | 'CENTRO')[]
      const pisos = searchData.pisosBloqueados.split(',').map(Number)

      const asientosBloqueadosData: Asiento[] = asientosIds.map((id, index) => ({
        numero: id,
        disponible: true,
        precio: precios[index],
        tipo: tipos[index],
        piso: pisos[index],
        calidad: 'Estándar',
      }))

      setBlockedSeats(asientosBloqueadosData)
      if (searchData.codigoReferencia) {
        setBlockReferenceCode(searchData.codigoReferencia)
      }
    }
  }, [])

  const consultarAsientosRequest: ConsultarAsientosRequest | null = search ? {
    servicioId: search.servicioId,
    origenId: search.origenId,
    destinoId: search.destinoId,
    empresaId: search.empresaId,
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
    if (selectedSeats.length > 0 && search && !blockedSeats.length) {
      setIsBlockingSeats(true)
      
      try {
        const result = await bloquearAsientosMutation.mutateAsync({
          servicioId: search.servicioId,
          origenId: search.origenId,
          destinoId: search.destinoId,
          empresaId: search.empresaId,
          asientos: selectedSeats.map(seat => seat.numero),
        })

        if (result.exitoso) {
          setBlockedSeats(selectedSeats)
          setBlockReferenceCode(result.codigoReferencia)
          setSelectedSeats([])
        } else {
          // TODO: Show error message to user
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
    window.location.href = '/sales'
  }

  const handleContinueToCheckout = () => {
    if (blockedSeats.length > 0 && search) {
      // Navigate to checkout with blocked seats info
      const checkoutParams = new URLSearchParams({
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
        asientosIds: blockedSeats.map(seat => seat.numero).join(','),
        precios: blockedSeats.map(seat => seat.precio.toString()).join(','),
        tipos: blockedSeats.map(seat => seat.tipo).join(','),
        pisos: blockedSeats.map(seat => seat.piso.toString()).join(','),
        codigoReferencia: blockReferenceCode || '',
        empresaBoleto: search.empresaBoleto || '',
        calidad: search.calidad || '',
      })
      window.location.href = `/sales/checkout?${checkoutParams.toString()}`
    }
  }

  if (!search || !search.servicioId) {
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
            <h1 className="text-2xl font-bold">Selección de Asientos</h1>
            <p className="text-muted-foreground">
              {search.origen} → {search.destino} • {search.fecha?.split('T')[0]} {search.hora}
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
            <ServiceInfo servicioInfo={asientosData.servicioInfo} empresaNombre={search.empresa} serviceCharge={search.serviceCharge} />

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
                      {search.serviceCharge && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Cargo por servicio ({search.serviceCharge}%)</span>
                          <span className="text-sm font-medium">
                            {new Intl.NumberFormat('es-PY', {
                              style: 'currency',
                              currency: 'PYG',
                              minimumFractionDigits: 0,
                            }).format(
                              Math.round(
                                (blockedSeats.length > 0 ? blockedSeats : selectedSeats).reduce((total, seat) => total + seat.precio, 0) * 
                                (parseFloat(search.serviceCharge) / 100)
                              )
                            )}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-lg font-bold">
                          {new Intl.NumberFormat('es-PY', {
                            style: 'currency',
                            currency: 'PYG',
                            minimumFractionDigits: 0,
                          }).format(
                            (blockedSeats.length > 0 ? blockedSeats : selectedSeats).reduce((total, seat) => total + seat.precio, 0) +
                            (search.serviceCharge ? 
                              Math.round(
                                (blockedSeats.length > 0 ? blockedSeats : selectedSeats).reduce((total, seat) => total + seat.precio, 0) * 
                                (parseFloat(search.serviceCharge) / 100)
                              ) : 0
                            )
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
                    Continuar al Checkout
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
