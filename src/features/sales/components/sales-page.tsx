import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, RotateCcw, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSidebar } from '@/components/ui/sidebar'
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
  { valor: 'cualquiera', etiqueta: 'Cualquier hora', desde: 0, hasta: 24 },
  { valor: 'madrugada', etiqueta: 'Madrugada · 00 a 06', desde: 0, hasta: 6 },
  { valor: 'manana', etiqueta: 'Mañana · 06 a 12', desde: 6, hasta: 12 },
  { valor: 'tarde', etiqueta: 'Tarde · 12 a 18', desde: 12, hasta: 18 },
  { valor: 'noche', etiqueta: 'Noche · 18 a 24', desde: 18, hasta: 24 },
] as const

const TODAS = 'todas'

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
  const [franja, setFranja] = useState<string>('cualquiera')
  const [empresa, setEmpresa] = useState<string>(TODAS)
  const [calidad, setCalidad] = useState<string>(TODAS)

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
    setFranja('cualquiera')
    setEmpresa(TODAS)
    setCalidad(TODAS)
    setRoundTripData({ ida: { origen: null, destino: null, fecha: null } })
  }

  // Las opciones salen de lo que vino, no de una lista fija: una empresa que no
  // vuela esa ruta no tiene por qué aparecer en el filtro.
  const empresas = useMemo(
    () => [...new Set((servicios ?? []).map((e) => e.empresa))].sort(),
    [servicios]
  )

  const calidades = useMemo(
    () =>
      [
        ...new Set(
          (servicios ?? []).flatMap((e) => e.data.map((s) => s.Calidad))
        ),
      ]
        .filter(Boolean)
        .sort(),
    [servicios]
  )

  /** El filtrado de franja, empresa y calidad se hace acá: ya vino todo el día. */
  const resultados = useMemo(() => {
    const rango = FRANJAS.find((f) => f.valor === franja) ?? FRANJAS[0]

    return (servicios ?? [])
      .filter((e) => empresa === TODAS || e.empresa === empresa)
      .map((e) => ({
        ...e,
        data: e.data.filter((servicio) => {
          if (calidad !== TODAS && servicio.Calidad !== calidad) return false

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

  return (
    <div className='space-y-4'>
      {/* Los diez controles en una línea.
          Los anchos son distintos a propósito: lo que se lee —origen y
          destino— se estira, y lo que se elige de una lista corta queda fijo y
          angosto. Una grilla de columnas iguales los tira a dos filas. */}
      <div className='border-border flex flex-wrap items-end gap-2.5 border-b pb-4'>
        <div className='max-w-[16rem] min-w-[9rem] flex-1'>
          <ParadaSearch
            value={searchData.origen}
            onValueChange={(origen) =>
              setSearchData((prev) => ({ ...prev, origen }))
            }
            placeholder='Elegí el origen...'
            label='Origen'
          />
        </div>

        <div className='max-w-[16rem] min-w-[9rem] flex-1'>
          <ParadaSearch
            value={searchData.destino}
            onValueChange={(destino) =>
              setSearchData((prev) => ({ ...prev, destino }))
            }
            placeholder='Elegí el destino...'
            label='Destino'
          />
        </div>

        <div className='w-[7.5rem] flex-none space-y-1'>
          <span className='text-muted-foreground text-xs font-medium'>
            Salida
          </span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-9 w-full justify-start px-2.5 text-left text-sm font-normal'
              >
                <CalendarIcon className='mr-1.5 h-4 w-4 flex-none' />
                {searchData.fechaIda ? (
                  format(searchData.fechaIda, 'dd/MM/yy', { locale: es })
                ) : (
                  <span className='text-muted-foreground'>dd/mm/aa</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                mode='single'
                selected={searchData.fechaIda || undefined}
                onSelect={(fecha) =>
                  setSearchData((prev) => ({
                    ...prev,
                    fechaIda: fecha || null,
                  }))
                }
                disabled={(fecha) => {
                  const hoy = new Date()
                  hoy.setHours(0, 0, 0, 0)
                  return fecha < hoy
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className='w-[7.5rem] flex-none space-y-1'>
          <span className='text-muted-foreground text-xs font-medium'>
            Vuelta
          </span>
          {showVuelta ? (
            <div className='flex items-center gap-1'>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className='h-9 flex-1 justify-start px-2.5 text-left text-sm font-normal'
                  >
                    {searchData.fechaVuelta ? (
                      format(searchData.fechaVuelta, 'dd/MM/yy', {
                        locale: es,
                      })
                    ) : (
                      <span className='text-muted-foreground'>dd/mm/aa</span>
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
              <Button
                variant='ghost'
                size='icon'
                className='h-9 w-7 flex-none'
                aria-label='Sacar la vuelta'
                onClick={() => {
                  setShowVuelta(false)
                  setSearchData((prev) => ({ ...prev, fechaVuelta: null }))
                }}
              >
                <X className='h-3.5 w-3.5' />
              </Button>
            </div>
          ) : (
            <Button
              variant='outline'
              className='text-muted-foreground h-9 w-full justify-start px-2.5 text-sm font-normal'
              onClick={() => setShowVuelta(true)}
            >
              + agregar
            </Button>
          )}
        </div>

        <div className='w-[6rem] flex-none space-y-1'>
          <label
            htmlFor='pasajeros'
            className='text-muted-foreground text-xs font-medium'
          >
            Pasajeros
          </label>
          <input
            id='pasajeros'
            type='number'
            min='1'
            value={filters.asientosMinimos}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                asientosMinimos: parseInt(e.target.value) || 1,
              }))
            }
            className='border-input bg-background h-9 w-full rounded-md border px-2.5 text-sm'
          />
        </div>

        <div className='w-[9.5rem] flex-none space-y-1'>
          <span className='text-muted-foreground text-xs font-medium'>
            Horario
          </span>
          <Select value={franja} onValueChange={setFranja}>
            <SelectTrigger className='h-9 w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FRANJAS.map((f) => (
                <SelectItem key={f.valor} value={f.valor}>
                  {f.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='w-[7.5rem] flex-none space-y-1'>
          <span className='text-muted-foreground text-xs font-medium'>
            Empresa
          </span>
          <Select
            value={empresa}
            onValueChange={setEmpresa}
            disabled={empresas.length === 0}
          >
            <SelectTrigger className='h-9 w-full'>
              <SelectValue placeholder='Todas' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas</SelectItem>
              {empresas.map((nombre) => (
                <SelectItem key={nombre} value={nombre}>
                  {nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='w-[7.5rem] flex-none space-y-1'>
          <span className='text-muted-foreground text-xs font-medium'>
            Calidad
          </span>
          <Select
            value={calidad}
            onValueChange={setCalidad}
            disabled={calidades.length === 0}
          >
            <SelectTrigger className='h-9 w-full'>
              <SelectValue placeholder='Cualquiera' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Cualquiera</SelectItem>
              {calidades.map((codigo) => (
                <SelectItem key={codigo} value={codigo}>
                  {codigo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={buscar}
          disabled={!canSearch}
          className='h-9 flex-none'
        >
          <Search className='mr-1.5 h-4 w-4' />
          Buscar
        </Button>

        <Button
          variant='ghost'
          onClick={limpiar}
          className='text-muted-foreground h-9 flex-none px-2.5'
        >
          <RotateCcw className='mr-1.5 h-4 w-4' />
          Limpiar
        </Button>
      </div>

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
