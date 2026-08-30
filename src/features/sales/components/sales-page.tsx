import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useSidebar } from '@/components/ui/sidebar'
import {
  BarraDeFiltros,
  FiltroDeSeleccion,
  type FiltroAplicado,
  type OpcionDeFiltro,
} from '@/components/filtros'
import { useRoundTrip } from '../context/round-trip-context'
import { useGetServicios } from '../hooks/use-get-servicios'
import type { SearchFilters, SearchFormData } from '../models/sales.model'
import { leerHorario } from '../utils/el-horario-del-servicio'
import { ParadaSearch } from './paradas/parada-search'
import { ServiciosList } from './servicios-list'

/** Con qué arranca la pantalla, y a qué vuelve «Limpiar filtros». */
const FILTROS_INICIALES: SearchFilters = {
  asientosMinimos: 1,
}

/**
 * Las franjas del día, para no pedir dos horas sueltas.
 *
 * Antes eran dos campos `time` que había que completar a mano y que arrancaban
 * vacíos, salvo después de «Limpiar», que sin explicación los dejaba en
 * 08:00–22:00 y escondía los servicios de madrugada.
 */
const FRANJAS = [
  { valor: 'madrugada', etiqueta: 'Madrugada · 00 a 06', desde: 0, hasta: 6 },
  { valor: 'manana', etiqueta: 'Mañana · 06 a 12', desde: 6, hasta: 12 },
  { valor: 'tarde', etiqueta: 'Tarde · 12 a 18', desde: 12, hasta: 18 },
  { valor: 'noche', etiqueta: 'Noche · 18 a 24', desde: 18, hasta: 24 },
] as const

const OPCIONES_DE_FRANJA: OpcionDeFiltro[] = FRANJAS.map((f) => ({
  valor: f.valor,
  etiqueta: f.etiqueta,
}))

export function SalesPage() {
  const { roundTripData, setRoundTripData } = useRoundTrip()
  const { setOpen } = useSidebar()

  /**
   * Mientras se vende, el menú queda en íconos.
   *
   * En una notebook de 1366 px el menú abierto se lleva 210: con eso los
   * controles de búsqueda no entran en una línea y se parten en dos. Al salir
   * de la pantalla se devuelve como estaba, porque es una preferencia del
   * vendedor y no algo que ventas deba decidirle para todo el panel.
   */
  useEffect(() => {
    setOpen(false)
    return () => setOpen(true)
  }, [setOpen])

  const [searchData, setSearchData] = useState<SearchFormData>({
    origen: roundTripData.ida.origen || null,
    destino: roundTripData.ida.destino || null,
    fechaIda: roundTripData.ida.fecha || null,
    fechaVuelta: roundTripData.vuelta?.fecha || null,
  })

  const [showVuelta, setShowVuelta] = useState(!!roundTripData.vuelta?.fecha)
  const [shouldSearch, setShouldSearch] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(FILTROS_INICIALES)
  const [franja, setFranja] = useState<string | undefined>()
  const [empresa, setEmpresa] = useState<string | undefined>()
  const [calidad, setCalidad] = useState<string | undefined>()

  const canSearch = Boolean(
    searchData.origen && searchData.destino && searchData.fechaIda
  )

  const searchParams = useMemo(() => {
    if (!canSearch) return null

    return {
      origenDestinoId: searchData.origen!.id,
      destinoDestinoId: searchData.destino!.id,
      // `format` y no `toISOString`: convertir a UTC antes de cortar depende de
      // estar en un huso negativo para dar el día correcto.
      fecha: format(searchData.fechaIda!, 'yyyy-MM-dd'),
      ...filters,
    }
  }, [canSearch, searchData, filters])

  const {
    data: servicios,
    isLoading,
    error,
  } = useGetServicios(
    searchParams || { origenDestinoId: '', destinoDestinoId: '', fecha: '' },
    shouldSearch
  )

  const buscar = () => {
    if (!canSearch) return

    setRoundTripData({
      ida: {
        origen: searchData.origen,
        destino: searchData.destino,
        fecha: searchData.fechaIda,
      },
      vuelta:
        showVuelta && searchData.fechaVuelta
          ? {
              origen: searchData.destino,
              destino: searchData.origen,
              fecha: searchData.fechaVuelta,
            }
          : undefined,
    })
    setShouldSearch(true)
  }

  const limpiar = () => {
    setSearchData({
      origen: null,
      destino: null,
      fechaIda: null,
      fechaVuelta: null,
    })
    setShowVuelta(false)
    setShouldSearch(false)
    setFilters(FILTROS_INICIALES)
    setFranja(undefined)
    setEmpresa(undefined)
    setCalidad(undefined)
    setRoundTripData({ ida: { origen: null, destino: null, fecha: null } })
  }

  // Las opciones salen de lo que vino, no de una lista fija: una empresa que no
  // vuela esa ruta no tiene por qué aparecer en el filtro.
  const opcionesDeEmpresa: OpcionDeFiltro[] = useMemo(
    () =>
      [...new Set((servicios ?? []).map((e) => e.empresa))]
        .sort()
        .map((nombre) => ({ valor: nombre, etiqueta: nombre })),
    [servicios]
  )

  const opcionesDeCalidad: OpcionDeFiltro[] = useMemo(
    () =>
      [
        ...new Set(
          (servicios ?? []).flatMap((e) => e.data.map((s) => s.Calidad))
        ),
      ]
        .filter(Boolean)
        .sort()
        .map((codigo) => ({ valor: codigo, etiqueta: codigo })),
    [servicios]
  )

  /** El filtrado de franja, empresa y calidad se hace acá: ya vino todo el día. */
  const resultados = useMemo(() => {
    const rango = FRANJAS.find((f) => f.valor === franja)

    return (servicios ?? [])
      .filter((e) => !empresa || e.empresa === empresa)
      .map((e) => ({
        ...e,
        data: e.data.filter((servicio) => {
          if (calidad && servicio.Calidad !== calidad) return false
          if (!rango) return true

          const hora = parseInt(
            leerHorario(servicio.Embarque, servicio.Desembarque).sale.slice(
              0,
              2
            ),
            10
          )
          if (Number.isNaN(hora)) return true
          return hora >= rango.desde && hora < rango.hasta
        }),
      }))
      .filter((e) => e.data.length > 0)
  }, [servicios, franja, empresa, calidad])

  const cuantas = resultados.reduce((total, e) => total + e.data.length, 0)

  const aplicados: FiltroAplicado[] = [
    searchData.origen && {
      clave: 'origen',
      etiqueta: 'Origen',
      valor: searchData.origen.nombre,
    },
    searchData.destino && {
      clave: 'destino',
      etiqueta: 'Destino',
      valor: searchData.destino.nombre,
    },
    searchData.fechaIda && {
      clave: 'fechaIda',
      etiqueta: 'Salida',
      valor: format(searchData.fechaIda, 'dd/MM/yy', { locale: es }),
    },
    searchData.fechaVuelta && {
      clave: 'fechaVuelta',
      etiqueta: 'Vuelta',
      valor: format(searchData.fechaVuelta, 'dd/MM/yy', { locale: es }),
    },
    (filters.asientosMinimos ?? 1) > 1 && {
      clave: 'pasajeros',
      etiqueta: 'Pasajeros',
      valor: String(filters.asientosMinimos),
    },
    franja && {
      clave: 'franja',
      etiqueta: 'Sale',
      valor: FRANJAS.find((f) => f.valor === franja)?.etiqueta ?? franja,
    },
    empresa && { clave: 'empresa', etiqueta: 'Empresa', valor: empresa },
    calidad && { clave: 'calidad', etiqueta: 'Calidad', valor: calidad },
  ].filter(Boolean) as FiltroAplicado[]

  const quitarFiltro = (clave: string) => {
    if (clave === 'origen') setSearchData((p) => ({ ...p, origen: null }))
    if (clave === 'destino') setSearchData((p) => ({ ...p, destino: null }))
    if (clave === 'fechaIda') setSearchData((p) => ({ ...p, fechaIda: null }))
    if (clave === 'fechaVuelta') {
      setSearchData((p) => ({ ...p, fechaVuelta: null }))
      setShowVuelta(false)
    }
    if (clave === 'pasajeros') setFilters(FILTROS_INICIALES)
    if (clave === 'franja') setFranja(undefined)
    if (clave === 'empresa') setEmpresa(undefined)
    if (clave === 'calidad') setCalidad(undefined)
  }

  return (
    <div className='space-y-4'>
      {/* Los mismos filtros de la caja: una línea, sin etiquetas dibujadas
          —el control se explica con su propio texto— y los chips debajo
          diciendo qué quedó puesto. */}
      <BarraDeFiltros
        aplicados={aplicados}
        onQuitar={quitarFiltro}
        onLimpiar={limpiar}
        actualizando={isLoading}
      >
        <ParadaSearch
          value={searchData.origen}
          onValueChange={(origen) =>
            setSearchData((prev) => ({ ...prev, origen }))
          }
          placeholder='Origen'
          label=''
          className='w-[13rem]'
        />

        <ParadaSearch
          value={searchData.destino}
          onValueChange={(destino) =>
            setSearchData((prev) => ({ ...prev, destino }))
          }
          placeholder='Destino'
          label=''
          className='w-[13rem]'
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className='h-9 w-[8.5rem] justify-start px-3 text-left font-normal'
            >
              <CalendarIcon className='mr-2 h-4 w-4 flex-none' />
              {searchData.fechaIda ? (
                format(searchData.fechaIda, 'dd/MM/yy', { locale: es })
              ) : (
                <span className='text-muted-foreground'>Salida</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={searchData.fechaIda || undefined}
              onSelect={(fecha) =>
                setSearchData((prev) => ({ ...prev, fechaIda: fecha || null }))
              }
              disabled={(fecha) => {
                const hoy = new Date()
                hoy.setHours(0, 0, 0, 0)
                return fecha < hoy
              }}
            />
          </PopoverContent>
        </Popover>

        {showVuelta ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-9 w-[8.5rem] justify-start px-3 text-left font-normal'
              >
                <CalendarIcon className='mr-2 h-4 w-4 flex-none' />
                {searchData.fechaVuelta ? (
                  format(searchData.fechaVuelta, 'dd/MM/yy', { locale: es })
                ) : (
                  <span className='text-muted-foreground'>Vuelta</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={searchData.fechaVuelta || undefined}
                onSelect={(fecha) =>
                  setSearchData((prev) => ({
                    ...prev,
                    fechaVuelta: fecha || null,
                  }))
                }
                disabled={(fecha) =>
                  fecha < (searchData.fechaIda || new Date())
                }
              />
            </PopoverContent>
          </Popover>
        ) : (
          <Button
            variant='outline'
            className='text-muted-foreground h-9 px-3 font-normal'
            onClick={() => setShowVuelta(true)}
          >
            <Plus className='mr-1.5 h-3.5 w-3.5' />
            Vuelta
          </Button>
        )}

        <div className='relative w-[7.5rem]'>
          <Users className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2' />
          <Input
            type='number'
            min='1'
            aria-label='Cuántos pasajeros'
            value={filters.asientosMinimos ?? 1}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                asientosMinimos: parseInt(e.target.value) || 1,
              }))
            }
            className='h-9 pl-8'
          />
        </div>

        <FiltroDeSeleccion
          id='franja'
          etiqueta='Horario de salida'
          etiquetaDeTodos='Cualquier hora'
          placeholder='Cualquier hora'
          opciones={OPCIONES_DE_FRANJA}
          valor={franja}
          onCambiar={setFranja}
          className='w-[11rem]'
        />

        <FiltroDeSeleccion
          id='empresa'
          etiqueta='Empresa'
          etiquetaDeTodos='Todas las empresas'
          placeholder='Empresa'
          opciones={opcionesDeEmpresa}
          valor={empresa}
          onCambiar={setEmpresa}
          className='w-[10rem]'
        />

        <FiltroDeSeleccion
          id='calidad'
          etiqueta='Calidad'
          etiquetaDeTodos='Cualquier calidad'
          placeholder='Calidad'
          opciones={opcionesDeCalidad}
          valor={calidad}
          onCambiar={setCalidad}
          className='w-[10rem]'
        />

        <Button onClick={buscar} disabled={!canSearch} className='h-9'>
          <Search className='mr-1.5 h-4 w-4' />
          Buscar
        </Button>
      </BarraDeFiltros>

      {shouldSearch && canSearch && (
        <div className='space-y-3'>
          <div className='flex items-baseline gap-2.5'>
            <h2 className='text-base font-semibold'>
              {isLoading
                ? 'Buscando salidas…'
                : cuantas === 1
                  ? '1 salida'
                  : `${cuantas} salidas`}
            </h2>
            {!isLoading && cuantas > 0 && (
              <span className='text-muted-foreground text-sm'>
                ordenadas por hora de salida
              </span>
            )}
          </div>

          {error ? (
            // El error se dibuja EN LUGAR de la lista, no encima: antes se
            // mostraba el mensaje y abajo la lista vacía, como si además no
            // hubiera resultados.
            <div className='border-destructive/40 bg-destructive/5 rounded-lg border px-5 py-6'>
              <p className='text-destructive mb-1 font-medium'>
                No se pudieron traer las salidas
              </p>
              <p className='text-muted-foreground text-sm'>{error.message}</p>
            </div>
          ) : (
            <ServiciosList
              data={resultados}
              isLoading={isLoading}
              origen={searchData.origen}
              destino={searchData.destino}
            />
          )}
        </div>
      )}
    </div>
  )
}
