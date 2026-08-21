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
import { useLiberarBloqueosAlSalir } from '../../hooks/use-liberar-bloqueos-al-salir'
import {
  calcularCargoServicio,
  describirCargoServicio,
  formatearGuaranies,
  sumarPreciosAsientos,
} from '../../utils/money'
import {
  deserializarServiceCharge,
  serializarServiceCharge,
} from '../../utils/service-charge-url'
import type { Asiento, ConsultarAsientosRequest, ServiceCharge } from '../../models/sales.model'
import { toast } from 'sonner'

const MAX_ASIENTOS = 2

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
  codigoReferencia?: string
  bloqueoExpiraEn?: string
  asientosBloqueados?: string
  preciosBloqueados?: string
  tiposBloqueados?: string
  pisosBloqueados?: string
  empresaBoleto?: string // Emp del servicio
  calidad?: string // Calidad del servicio
}

export function SeatSelectionPage() {
  const [search, setSearch] = useState<SeatSelectionSearch | null>(null)
  const [serviceCharge, setServiceCharge] = useState<ServiceCharge | undefined>()
  const [selectedSeats, setSelectedSeats] = useState<Asiento[]>([])
  const [blockedSeats, setBlockedSeats] = useState<Asiento[]>([])
  const [blockReferenceCode, setBlockReferenceCode] = useState<string | null>(null)
  const [bloqueoExpiraEn, setBloqueoExpiraEn] = useState<string | null>(null)
  const [errorBloqueo, setErrorBloqueo] = useState<string | null>(null)
  const [bloqueoVencido, setBloqueoVencido] = useState(false)

  /**
   * Guarda contra doble envío del bloqueo. Es un `ref` porque tiene que
   * cerrarse de forma síncrona: dos clicks seguidos se despachan antes de que
   * React vuelva a renderizar. Se reabre sólo si el bloqueo falló o si se
   * liberaron los asientos.
   */
  const bloqueoCerrado = useRef(false)
  // Mientras navegamos al checkout el bloqueo sigue haciendo falta: sin esta
  // marca, el `beforeunload` de la navegación liberaría los asientos.
  const navegandoAlCheckout = useRef(false)

  useEffect(() => {
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
      codigoReferencia: urlParams.get('codigoReferencia') || undefined,
      bloqueoExpiraEn: urlParams.get('bloqueoExpiraEn') || undefined,
      asientosBloqueados: urlParams.get('asientosBloqueados') || undefined,
      preciosBloqueados: urlParams.get('preciosBloqueados') || undefined,
      tiposBloqueados: urlParams.get('tiposBloqueados') || undefined,
      pisosBloqueados: urlParams.get('pisosBloqueados') || undefined,
      empresaBoleto: urlParams.get('empresaBoleto') || undefined,
      calidad: urlParams.get('calidad') || undefined,
    }
    setSearch(searchData)
    setServiceCharge(deserializarServiceCharge(urlParams))

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
      if (searchData.bloqueoExpiraEn) {
        setBloqueoExpiraEn(searchData.bloqueoExpiraEn)
      }
    }
  }, [])

  // Si el operador cierra la pestaña o se va a otra sección, los asientos se
  // liberan. Sin esto quedan retenidos 30 minutos sin venta detrás.
  useLiberarBloqueosAlSalir(() => [
    {
      codigoReferencia: blockReferenceCode,
      activo: !!blockReferenceCode && !navegandoAlCheckout.current,
    },
  ])

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
    if (blockedSeats.length > 0) return

    setErrorBloqueo(null)
    setSelectedSeats(prev => {
      if (prev.some(seat => seat.numero === asiento.numero)) {
        return prev.filter(seat => seat.numero !== asiento.numero)
      }

      if (prev.length >= MAX_ASIENTOS) {
        return prev
      }

      return [...prev, asiento]
    })
  }

  /**
   * El service lanza si el bloqueo falló o fue parcial, así que acá no hace
   * falta interpretar `exitoso`: llegar a la línea de abajo significa que los
   * asientos quedaron reservados de verdad.
   */
  const handleConfirmSelection = async () => {
    if (bloqueoCerrado.current) return
    if (selectedSeats.length === 0 || !search || blockedSeats.length > 0) return

    bloqueoCerrado.current = true
    setErrorBloqueo(null)

    try {
      const result = await bloquearAsientosMutation.mutateAsync({
        servicioId: search.servicioId,
        origenId: search.origenId,
        destinoId: search.destinoId,
        empresaId: search.empresaId,
        asientos: selectedSeats.map(seat => seat.numero),
      })

      setBlockedSeats(selectedSeats)
      setBlockReferenceCode(result.codigoReferencia)
      setBloqueoExpiraEn(result.tiempoExpiracion)
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
      setBlockedSeats([])
      setBlockReferenceCode(null)
      setBloqueoExpiraEn(null)
      setBloqueoVencido(false)
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
    if (blockReferenceCode) {
      await handleReleaseSeats()
    }
    window.location.href = '/sales'
  }

  const handleBloqueoVencido = useCallback(() => {
    setBloqueoVencido(true)
    toast.warning('El bloqueo de asientos venció', {
      description: 'Volvé a seleccionar los asientos antes de continuar.',
      duration: 10000,
    })
  }, [])

  const handleContinueToCheckout = () => {
    if (blockedSeats.length === 0 || !search || bloqueoVencido) return

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
      asientosIds: blockedSeats.map(seat => seat.numero).join(','),
      precios: blockedSeats.map(seat => seat.precio.toString()).join(','),
      tipos: blockedSeats.map(seat => seat.tipo).join(','),
      pisos: blockedSeats.map(seat => seat.piso.toString()).join(','),
      codigoReferencia: blockReferenceCode || '',
      bloqueoExpiraEn: bloqueoExpiraEn || '',
      empresaBoleto: search.empresaBoleto || '',
      calidad: search.calidad || '',
    })
    serializarServiceCharge(checkoutParams, serviceCharge)

    navegandoAlCheckout.current = true
    window.location.href = `/sales/checkout?${checkoutParams.toString()}`
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

  const asientosVisibles = blockedSeats.length > 0 ? blockedSeats : selectedSeats
  const importePasajes = sumarPreciosAsientos(asientosVisibles)
  const cargoServicio = calcularCargoServicio(importePasajes, serviceCharge)
  const total = importePasajes + cargoServicio
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
            <h1 className="text-2xl font-bold">Selección de Asientos</h1>
            <p className="text-muted-foreground">
              {search.origen} → {search.destino} • {search.fecha?.split('T')[0]} {search.hora}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TiempoBloqueo expiraEn={bloqueoExpiraEn} onExpirado={handleBloqueoVencido} />
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
            <ServiceInfo servicioInfo={asientosData.servicioInfo} empresaNombre={search.empresa} />

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
                        Asientos Reservados ({blockedSeats.length}/{MAX_ASIENTOS})
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Asientos Seleccionados ({selectedSeats.length}/{MAX_ASIENTOS})
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
                            {describirCargoServicio(serviceCharge)}
                          </span>
                          <span className="text-sm font-medium">
                            {formatearGuaranies(cargoServicio)}
                          </span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total</span>
                        <span className="text-lg font-bold">
                          {formatearGuaranies(total)}
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
