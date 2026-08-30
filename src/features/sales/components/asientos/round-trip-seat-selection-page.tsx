import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, Info, Lock, Unlock, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useRoundTrip } from '../../context/round-trip-context'
import { useBloquearAsientos } from '../../hooks/use-bloquear-asientos'
import { useGetAsientos } from '../../hooks/use-get-asientos'
import { useLiberarBloqueo } from '../../hooks/use-liberar-bloqueo'
import type {
  Asiento,
  ConsultarAsientosRequest,
} from '../../models/sales.model'
import { buscarJuntas, rangoEntre } from '../../utils/butacas-juntas'
import { leerHorario } from '../../utils/el-horario-del-servicio'
import {
  leerCalidades,
  nombrarCalidad,
} from '../../utils/las-calidades-del-servicio'
import {
  calcularCargoServicio,
  formatearGuaranies,
  sumarPreciosAsientos,
  describirCargoServicio,
} from '../../utils/money'
import { SeatGrid } from './seat-grid'
import { SeatLegend } from './seat-legend'
import { TiempoBloqueo } from './tiempo-bloqueo'

/**
 * A partir de acá se avisa antes de reservar.
 *
 * No es un tope: el backend nunca tuvo uno —sólo valida que no se mande cero—
 * y una delegación de veinte butacas es una venta legítima. El aviso está para
 * que nadie bloquee medio colectivo de un click por error.
 *
 * Antes había un máximo de 2, que obligaba a partir una familia de cuatro en
 * dos ventas, con dos facturas y dos cobros.
 */
const BUTACAS_QUE_MERECEN_AVISO = 10

interface SeatSelectionPageProps {
  tripType?: 'ida' | 'vuelta'
  onComplete?: (
    servicio: unknown,
    asientos: Asiento[],
    codigoReferencia: string
  ) => void
}

export function RoundTripSeatSelectionPage({
  tripType = 'ida',
  onComplete: _onComplete,
}: SeatSelectionPageProps) {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()
  const [selectedSeats, setSelectedSeats] = useState<Asiento[]>([])
  const [errorBloqueo, setErrorBloqueo] = useState<string | null>(null)
  const [bloqueoVencido, setBloqueoVencido] = useState(false)

  /** Cuántas butacas busca el vendedor. Arranca en las que pidió al buscar. */
  const [cuantasNecesito, setCuantasNecesito] = useState('1')

  /**
   * La última butaca tocada, que es el ancla de ⇧+clic.
   *
   * Sin ancla, ⇧+clic no tiene desde dónde medir el rango.
   */
  const [ultimaTocada, setUltimaTocada] = useState<Asiento | null>(null)

  /**
   * Guarda contra doble envío del bloqueo.
   *
   * Es un `ref` porque tiene que cerrarse de forma síncrona: dos clicks
   * seguidos se despachan antes de que React vuelva a renderizar. Se reabre
   * sólo si el bloqueo falló o si se liberaron los asientos.
   */
  const bloqueoCerrado = useRef(false)

  const currentTripData =
    tripType === 'ida' ? roundTripData.ida : roundTripData.vuelta

  // Los asientos bloqueados y su código viven en el contexto: son la única
  // fuente de verdad. Antes había un estado local paralelo que se desincronizaba.
  const blockedSeats = currentTripData?.asientos ?? []
  const blockReferenceCode = currentTripData?.codigoReferencia ?? null

  const consultarAsientosRequest: ConsultarAsientosRequest | null =
    currentTripData?.servicio &&
    currentTripData?.agenciaId &&
    currentTripData?.origen &&
    currentTripData?.destino
      ? {
          servicioId: currentTripData.servicio.Id,
          origenId: currentTripData.origen.id,
          destinoId: currentTripData.destino.id,
          agenciaId: currentTripData.agenciaId,
        }
      : null

  const {
    data: asientosData,
    isLoading,
    error,
  } = useGetAsientos(consultarAsientosRequest)
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
    [currentTripData, setRoundTripData, tripType]
  )

  useEffect(() => {
    setBloqueoVencido(false)
  }, [blockReferenceCode])

  const handleSeatSelect = (asiento: Asiento, conShift?: boolean) => {
    if (blockedSeats.length > 0) return

    setErrorBloqueo(null)

    // ⇧+clic lleva todo lo que hay entre la última tocada y esta. Con
    // dieciocho butacas, elegirlas de a una son dieciocho clicks y al menos
    // una equivocada.
    if (conShift && ultimaTocada && asientosData) {
      const rango = rangoEntre(
        asientosData.asientos,
        ultimaTocada,
        asiento,
        asientosData.configuracionBus
      )

      setSelectedSeats((prev) => {
        const yaElegidas = new Set(prev.map((seat) => seat.numero))
        return [
          ...prev,
          ...rango.filter((seat) => !yaElegidas.has(seat.numero)),
        ]
      })
      setUltimaTocada(asiento)
      return
    }

    setUltimaTocada(asiento)
    setSelectedSeats((prev) => {
      if (prev.some((seat) => seat.numero === asiento.numero)) {
        return prev.filter((seat) => seat.numero !== asiento.numero)
      }

      return [...prev, asiento]
    })
  }

  /** Elige de un saque las butacas que el vendedor pidió, si están juntas. */
  const handleBuscarJuntas = () => {
    if (!asientosData || blockedSeats.length > 0) return

    const cuantas = parseInt(cuantasNecesito, 10)
    if (!Number.isFinite(cuantas) || cuantas < 1) return

    const juntas = buscarJuntas(
      asientosData.asientos,
      cuantas,
      asientosData.configuracionBus
    )

    if (!juntas) {
      toast.warning(`No hay ${cuantas} butacas juntas en este servicio`, {
        description:
          'Probá con menos, elegilas sueltas del plano, o buscá otro servicio.',
        duration: 6000,
      })
      return
    }

    setErrorBloqueo(null)
    setSelectedSeats(juntas)
    setUltimaTocada(juntas[juntas.length - 1])
  }

  const handleVaciar = () => {
    setSelectedSeats([])
    setUltimaTocada(null)
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
    if (
      selectedSeats.length === 0 ||
      !currentTripData?.servicio ||
      blockedSeats.length > 0
    )
      return

    bloqueoCerrado.current = true
    setErrorBloqueo(null)

    try {
      const result = await bloquearAsientosMutation.mutateAsync({
        servicioId: currentTripData.servicio.Id,
        origenId: currentTripData.origen!.id,
        destinoId: currentTripData.destino!.id,
        agenciaId: currentTripData.agenciaId!,
        asientos: selectedSeats.map((seat) => seat.numero),
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
      <div className='space-y-4'>
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            No se encontró información del servicio. Por favor, selecciona un
            servicio desde la página anterior.
          </AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} variant='outline'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Volver a Servicios
        </Button>
      </div>
    )
  }

  const asientosVisibles =
    blockedSeats.length > 0 ? blockedSeats : selectedSeats
  const importePasajes = sumarPreciosAsientos(asientosVisibles)
  const cargoServicio = calcularCargoServicio(
    importePasajes,
    currentTripData.serviceCharge
  )
  const totalTramo = importePasajes + cargoServicio
  const bloqueando = bloquearAsientosMutation.isPending
  const reservadas = blockedSeats.length > 0

  const horario = leerHorario(
    currentTripData.servicio.Embarque,
    currentTripData.servicio.Desembarque
  )

  // El desglose se arma sobre lo elegido, no sobre el vehículo: al vendedor le
  // sirve saber cuántas de cada calidad va a cobrar, no cuántas tiene el bus.
  const porCalidad = leerCalidades(asientosData?.asientos ?? [])
    .map((calidad) => ({
      ...calidad,
      butacas: asientosVisibles.filter(
        (asiento) => nombrarCalidad(asiento.calidad ?? '') === calidad.calidad
      ).length,
    }))
    .filter((calidad) => calidad.butacas > 0)

  return (
    <div className='flex flex-col gap-3.5'>
      <div className='flex items-start gap-3'>
        <Button
          variant='outline'
          size='sm'
          className='h-7 px-3 text-xs'
          onClick={handleGoBack}
          disabled={liberarBloqueoMutation.isPending}
        >
          <ArrowLeft className='mr-1.5 h-3.5 w-3.5' />
          Volver
        </Button>

        <div className='min-w-0'>
          <h1 className='text-xl font-bold tracking-tight'>
            {tripType === 'vuelta'
              ? 'Elegí las butacas de la vuelta'
              : 'Elegí las butacas'}
          </h1>
          <p className='text-muted-foreground mt-0.5 truncate text-[12.5px]'>
            {[
              currentTripData.servicio.Emp,
              `${currentTripData.origen?.nombre} → ${currentTripData.destino?.nombre}`,
              `sale ${horario.sale}`,
              asientosData &&
                `${asientosData.totalDisponibles} libres de ${asientosData.asientos.length}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className='ml-auto flex flex-none items-center gap-3'>
          <TiempoBloqueo
            expiraEn={currentTripData.bloqueoExpiraEn}
            onExpirado={handleBloqueoVencido}
          />
        </div>
      </div>

      {isLoading && (
        <div className='flex gap-4'>
          <Skeleton className='h-[420px] w-[220px] rounded-xl' />
          <Skeleton className='h-[420px] flex-1 rounded-xl' />
        </div>
      )}

      {error && (
        <div className='border-border rounded-lg border border-dashed px-6 py-10 text-center'>
          <p className='mb-1 font-medium'>No se pudo cargar el plano</p>
          <p className='text-muted-foreground mb-4 text-sm'>{error.message}</p>
          <Button onClick={handleGoBack} variant='outline' size='sm'>
            Volver a los servicios
          </Button>
        </div>
      )}

      {asientosData && !isLoading && !error && (
        <div className='grid items-start gap-4 xl:grid-cols-2'>
          {/* El plano toma sólo el ancho que necesita: es un colectivo, no una
              grilla que deba estirarse a media pantalla. Lo que sobra se lo
              queda el panel, que es el que lista las butacas una por una. */}
          <div className='border-border flex flex-col rounded-xl border p-4'>
            {!reservadas && (
              <div className='mb-3 flex flex-wrap items-center gap-2.5'>
                <span className='text-muted-foreground text-xs'>Necesito</span>
                <Input
                  type='number'
                  min={1}
                  value={cuantasNecesito}
                  onChange={(evento) => setCuantasNecesito(evento.target.value)}
                  className='h-[30px] w-16 text-[13px]'
                  aria-label='Cuántas butacas necesito'
                />
                <Button
                  variant='outline'
                  size='sm'
                  className='h-[27px] px-3 text-xs'
                  onClick={handleBuscarJuntas}
                >
                  Buscar {cuantasNecesito || 1} juntas
                </Button>
                <span className='text-muted-foreground ml-auto text-[11.5px]'>
                  Clic, y{' '}
                  <kbd className='border-border rounded-[3px] border px-1 font-mono font-normal'>
                    ⇧
                  </kbd>
                  +clic para un rango
                </span>
              </div>
            )}

            <div className='flex justify-center overflow-auto'>
              <SeatGrid
                asientos={asientosData.asientos}
                onSeatSelect={handleSeatSelect}
                selectedSeats={selectedSeats}
                blockedSeats={blockedSeats}
                configuracionBus={asientosData.configuracionBus}
              />
            </div>

            <div className='border-border mt-3 border-t pt-3'>
              <SeatLegend asientos={asientosData.asientos} />
            </div>
          </div>

          <div className='flex flex-col gap-2.5'>
            <div className='border-border rounded-xl border p-4'>
              <div className='mb-2 flex items-baseline'>
                <h2 className='text-sm font-semibold'>
                  {asientosVisibles.length === 0
                    ? 'Ninguna butaca todavía'
                    : `${asientosVisibles.length} ${asientosVisibles.length === 1 ? 'butaca' : 'butacas'}`}
                  {reservadas && (
                    <span className='text-estado-ok ml-2 text-xs font-medium'>
                      reservadas
                    </span>
                  )}
                </h2>
                {asientosVisibles.length > 0 && !reservadas && (
                  <button
                    onClick={handleVaciar}
                    className='text-muted-foreground hover:text-foreground ml-auto text-xs'
                  >
                    Vaciar
                  </button>
                )}
              </div>

              {asientosVisibles.length === 0 ? (
                <p className='text-muted-foreground text-[12.5px] leading-relaxed'>
                  Tocá las butacas en el plano, o pedí cuántas necesitás y
                  buscalas juntas.
                </p>
              ) : (
                <>
                  <div className='mb-3 grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-1.5'>
                    {asientosVisibles.map((seat) => (
                      <div
                        key={seat.numero}
                        className='border-border flex items-center justify-between gap-1.5 rounded-md border px-2 py-1.5 text-xs'
                      >
                        <span className='font-semibold tabular-nums'>
                          {seat.numero}
                        </span>
                        <span className='text-muted-foreground text-[11px] tabular-nums'>
                          {seat.precio.toLocaleString('es-PY')}
                        </span>
                        {!reservadas && (
                          <button
                            onClick={() => handleSeatSelect(seat)}
                            aria-label={`Sacar la butaca ${seat.numero}`}
                            className='text-muted-foreground hover:text-foreground -mr-0.5 flex-none'
                          >
                            <X className='h-3 w-3' />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {porCalidad.map((calidad) => (
                    <div
                      key={calidad.calidad}
                      className='flex items-baseline justify-between py-0.5 text-[12.5px]'
                    >
                      <span className='text-muted-foreground'>
                        {calidad.calidad} · {calidad.butacas} ×{' '}
                        {calidad.precio.toLocaleString('es-PY')}
                      </span>
                      <span className='font-medium tabular-nums'>
                        {(calidad.butacas * calidad.precio).toLocaleString(
                          'es-PY'
                        )}
                      </span>
                    </div>
                  ))}

                  {cargoServicio > 0 && (
                    <div className='flex items-baseline justify-between py-0.5 text-[12.5px]'>
                      <span className='text-muted-foreground'>
                        {describirCargoServicio(currentTripData.serviceCharge)}
                      </span>
                      <span className='font-medium tabular-nums'>
                        {cargoServicio.toLocaleString('es-PY')}
                      </span>
                    </div>
                  )}

                  <div className='border-border mt-2 flex items-baseline justify-between border-t pt-2.5'>
                    <span className='text-[12.5px] font-semibold'>Total</span>
                    <span className='text-xl font-bold tracking-tight tabular-nums'>
                      {formatearGuaranies(totalTramo)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {errorBloqueo && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{errorBloqueo}</AlertDescription>
              </Alert>
            )}

            {bloqueoVencido && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  La reserva venció. Liberala y volvé a elegir las butacas.
                </AlertDescription>
              </Alert>
            )}

            {!reservadas &&
              selectedSeats.length >= BUTACAS_QUE_MERECEN_AVISO &&
              asientosData && (
                <div className='border-estado-atencion/50 bg-estado-atencion/10 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-xs'>
                  <AlertTriangle className='text-estado-atencion mt-px h-3.5 w-3.5 flex-none' />
                  <div>
                    <p className='mb-0.5 font-semibold'>
                      Vas a reservar {selectedSeats.length} butacas
                    </p>
                    <p className='text-muted-foreground'>
                      Es{' '}
                      {Math.round(
                        (selectedSeats.length / asientosData.asientos.length) *
                          100
                      )}{' '}
                      % del colectivo.
                    </p>
                  </div>
                </div>
              )}

            {reservadas ? (
              <>
                <Button
                  onClick={handleContinueToCheckout}
                  className='h-10 w-full'
                  disabled={bloqueoVencido}
                >
                  {tripType === 'ida' && roundTripData.vuelta?.fecha
                    ? 'Seguir con la vuelta'
                    : 'Cargar los pasajeros'}
                </Button>
                <Button
                  onClick={handleReleaseSeats}
                  variant='outline'
                  className='w-full'
                  disabled={liberarBloqueoMutation.isPending}
                >
                  <Unlock className='mr-2 h-4 w-4' />
                  {liberarBloqueoMutation.isPending
                    ? 'Liberando…'
                    : 'Liberar las butacas'}
                </Button>
              </>
            ) : (
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedSeats.length === 0 || bloqueando}
                className='h-10 w-full'
              >
                {bloqueando ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current'></div>
                    Reservando con la empresa…
                  </>
                ) : selectedSeats.length === 0 ? (
                  'Elegí al menos una butaca'
                ) : (
                  <>
                    <Lock className='mr-2 h-4 w-4' />
                    Reservar {selectedSeats.length}{' '}
                    {selectedSeats.length === 1 ? 'butaca' : 'butacas'}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
