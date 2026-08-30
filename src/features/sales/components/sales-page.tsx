import { useState, useMemo } from 'react'
import { Search, RotateCcw, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ParadaSearch } from './paradas/parada-search'
import { ServiciosList } from './servicios-list'
import { useGetServicios } from '../hooks/use-get-servicios'
import { useRoundTrip } from '../context/round-trip-context'
import type { SearchFormData, SearchFilters } from '../models/sales.model'

/** Con qué arranca la pantalla, y a qué vuelve «Limpiar». */
const FILTROS_INICIALES: SearchFilters = {
  asientosMinimos: 1,
}

export function SalesPage() {
  const { roundTripData, setRoundTripData } = useRoundTrip()
  
  const [searchData, setSearchData] = useState<SearchFormData>({
    origen: roundTripData.ida.origen || null,
    destino: roundTripData.ida.destino || null,
    fechaIda: roundTripData.ida.fecha || null,
    fechaVuelta: roundTripData.vuelta?.fecha || null,
  })
  
  const [showVuelta, setShowVuelta] = useState(!!roundTripData.vuelta?.fecha)
  const [shouldSearch, setShouldSearch] = useState(false)
  /**
   * Arranca en 1, y a la vista.
   *
   * Estaba en 2 y escondido detrás de «Filtros»: una persona que viaja sola
   * —el caso más común del mostrador— recibía «No se encontraron servicios»
   * sin que nada en pantalla explicara por qué. Un filtro que no se ve es un
   * filtro que miente.
   */
  const [filters, setFilters] = useState<SearchFilters>(FILTROS_INICIALES)

  // Build search parameters for the API
  const searchParams = useMemo(() => {
    if (!searchData.origen || !searchData.destino || !searchData.fechaIda) {
      return null
    }

    const fechaFormatted = searchData.fechaIda.toISOString().split('T')[0]
    
    return {
      origenDestinoId: searchData.origen.id,
      destinoDestinoId: searchData.destino.id,
      fecha: fechaFormatted,
      ...filters,
    }
  }, [searchData, filters])

  const { data: servicios, isLoading, error } = useGetServicios(searchParams || {
    origenDestinoId: '',
    destinoDestinoId: '',
    fecha: '',
  }, shouldSearch)

  const handleSearch = () => {
    if (canSearch) {
      // Guardar datos en el contexto
      setRoundTripData({
        ida: {
          origen: searchData.origen,
          destino: searchData.destino,
          fecha: searchData.fechaIda
        },
        vuelta: showVuelta && searchData.fechaVuelta ? {
          origen: searchData.destino, // Invertir origen y destino para vuelta
          destino: searchData.origen,
          fecha: searchData.fechaVuelta
        } : undefined
      })
      setShouldSearch(true)
    }
  }

  const handleClear = () => {
    setSearchData({
      origen: null,
      destino: null,
      fechaIda: null,
      fechaVuelta: null,
    })
    setShowVuelta(false)
    setShouldSearch(false)
    setFilters(FILTROS_INICIALES)
    // Limpiar también el contexto
    setRoundTripData({
      ida: {
        origen: null,
        destino: null,
        fecha: null
      }
    })
  }

  const handleVueltaToggle = (checked: boolean) => {
    setShowVuelta(checked)
    if (checked && searchData.origen && searchData.destino) {
      // Invertir origen y destino para la vuelta
      setSearchData(prev => ({
        ...prev,
        fechaVuelta: null // Reset fecha de vuelta cuando se activa
      }))
    }
  }

  const canSearch = searchData.origen && searchData.destino && searchData.fechaIda

  const cuantasSalidas = (servicios ?? []).reduce(
    (total, empresa) => total + empresa.data.length,
    0
  )

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5" />
            Buscar Pasajes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Los diez controles en una línea. Los anchos son distintos a
              propósito: lo que se lee —origen y destino— se estira, y lo que
              se elige de una lista corta queda fijo y angosto. Una grilla de
              columnas iguales los tira a dos filas y deja huecos. */}
          <div className='flex flex-wrap items-end gap-3'>
            <div className='min-w-[11rem] max-w-[19rem] flex-1'>
              <ParadaSearch
                value={searchData.origen}
                onValueChange={(origen) =>
                  setSearchData((prev) => ({ ...prev, origen }))
                }
                placeholder='Elegí el origen...'
                label='Origen'
              />
            </div>

            <div className='min-w-[11rem] max-w-[19rem] flex-1'>
              <ParadaSearch
                value={searchData.destino}
                onValueChange={(destino) =>
                  setSearchData((prev) => ({ ...prev, destino }))
                }
                placeholder='Elegí el destino...'
                label='Destino'
              />
            </div>

            <div className='w-[8.5rem] flex-none space-y-1'>
              <span className='text-muted-foreground text-xs font-medium'>
                Salida
              </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='h-9 w-full justify-start px-2.5 text-left text-sm font-normal'
                >
                  <CalendarIcon className='mr-2 h-4 w-4 flex-none' />
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
            </div>

            {showVuelta && (
              <div className='w-[8.5rem] flex-none space-y-1'>
                <span className='text-muted-foreground text-xs font-medium'>
                  Vuelta
                </span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='h-9 w-full justify-start px-2.5 text-left text-sm font-normal'
                >
                  <CalendarIcon className='mr-2 h-4 w-4 flex-none' />
                  {searchData.fechaVuelta ? (
                    format(searchData.fechaVuelta, 'dd/MM/yy', { locale: es })
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
                    setSearchData((prev) => ({ ...prev, fechaVuelta: fecha || null }))
                  }
                  disabled={(fecha) =>
                    fecha < (searchData.fechaIda || new Date())}
                />
              </PopoverContent>
            </Popover>
              </div>
            )}

            <Button
              onClick={handleSearch}
              disabled={!canSearch}
              className='h-9 flex-none'
            >
              <Search className='mr-2 h-4 w-4' />
              Buscar
            </Button>
          </div>

          {/* Los filtros, a la vista y en una línea */}
          <div className="flex flex-wrap items-end gap-3 border-t pt-3">
            <div className="w-[7.5rem] space-y-1">
              <label htmlFor="hora-desde" className="text-muted-foreground text-xs font-medium">
                Sale desde
              </label>
              <input
                id="hora-desde"
                type="time"
                value={filters.horaDesde ?? ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, horaDesde: e.target.value || undefined }))
                }
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
              />
            </div>

            <div className="w-[7.5rem] space-y-1">
              <label htmlFor="hora-hasta" className="text-muted-foreground text-xs font-medium">
                hasta
              </label>
              <input
                id="hora-hasta"
                type="time"
                value={filters.horaHasta ?? ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, horaHasta: e.target.value || undefined }))
                }
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
              />
            </div>

            <div className="w-[6.5rem] space-y-1">
              <label htmlFor="pasajeros" className="text-muted-foreground text-xs font-medium">
                Pasajeros
              </label>
              <input
                id="pasajeros"
                type="number"
                min="1"
                value={filters.asientosMinimos}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    asientosMinimos: parseInt(e.target.value) || 1,
                  }))
                }
                className="border-input bg-background h-9 w-full rounded-md border px-2 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 pb-1.5">
              <Checkbox id="vuelta" checked={showVuelta} onCheckedChange={handleVueltaToggle} />
              <label htmlFor="vuelta" className="text-sm font-medium">
                Incluir vuelta
              </label>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="ml-auto h-9"
            >
              <RotateCcw className="mr-1 h-4 w-4" />
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {shouldSearch && canSearch && (
        <div className='space-y-3'>
          <div className='flex items-baseline gap-2.5'>
            <h2 className='text-base font-semibold'>
              {isLoading
                ? 'Buscando salidas…'
                : cuantasSalidas === 1
                  ? '1 salida'
                  : `${cuantasSalidas} salidas`}
            </h2>
            {!isLoading && cuantasSalidas > 0 && (
              <span className='text-muted-foreground text-sm'>
                ordenadas por hora de salida
              </span>
            )}
          </div>

          {error ? (
            // El error se dibuja en lugar de la lista, no encima: antes se
            // mostraba el mensaje Y abajo la lista vacía, como si además no
            // hubiera resultados.
            <div className='border-destructive/40 bg-destructive/5 rounded-lg border px-5 py-6'>
              <p className='text-destructive mb-1 font-medium'>
                No se pudieron traer las salidas
              </p>
              <p className='text-muted-foreground text-sm'>{error.message}</p>
            </div>
          ) : (
            <ServiciosList
              data={servicios || []}
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
