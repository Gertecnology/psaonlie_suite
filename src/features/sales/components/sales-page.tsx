import { useState, useMemo } from 'react'
import { Search, Filter, RotateCcw, Calendar as CalendarIcon, X } from 'lucide-react'
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

export function SalesPage() {
  const { roundTripData, setRoundTripData } = useRoundTrip()
  
  const [searchData, setSearchData] = useState<SearchFormData>({
    origen: roundTripData.ida.origen || null,
    destino: roundTripData.ida.destino || null,
    fechaIda: roundTripData.ida.fecha || null,
    fechaVuelta: roundTripData.vuelta?.fecha || null,
  })
  
  const [showVuelta, setShowVuelta] = useState(!!roundTripData.vuelta?.fecha)
  const [showFilters, setShowFilters] = useState(false)
  const [shouldSearch, setShouldSearch] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    asientosMinimos: 2,
  })

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
    setFilters({
      horaDesde: '08:00',
      horaHasta: '22:00',
      asientosMinimos: 2,
    })
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
          {/* Main Search Row */}
          <div className="grid gap-3 lg:grid-cols-4 md:grid-cols-2">
            <ParadaSearch
              value={searchData.origen}
              onValueChange={(origen) => setSearchData(prev => ({ ...prev, origen }))}
              placeholder="Seleccionar origen..."
              label="Origen"
            />
            
            <ParadaSearch
              value={searchData.destino}
              onValueChange={(destino) => setSearchData(prev => ({ ...prev, destino }))}
              placeholder="Seleccionar destino..."
              label="Destino"
            />

            {/* Compact Date Filters */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Fechas</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-sm h-9"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {searchData.fechaIda ? format(searchData.fechaIda, "dd/MM", { locale: es }) : "Fecha de Ida"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={searchData.fechaIda || undefined}
                        onSelect={(date) => setSearchData(prev => ({ ...prev, fechaIda: date || null }))}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          return date < today
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                {searchData.fechaIda && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchData(prev => ({ ...prev, fechaIda: null }))}
                    className="h-9 w-9 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                
                {showVuelta && (
                  <>
                    <div className="flex-1">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal text-sm h-9"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {searchData.fechaVuelta ? format(searchData.fechaVuelta, "dd/MM", { locale: es }) : "Fecha de Vuelta"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={searchData.fechaVuelta || undefined}
                            onSelect={(date) => setSearchData(prev => ({ ...prev, fechaVuelta: date || null }))}
                            disabled={(date) => {
                              const minDate = searchData.fechaIda || new Date()
                              return date < minDate
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {searchData.fechaVuelta && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchData(prev => ({ ...prev, fechaVuelta: null }))}
                        className="h-9 w-9 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <Button 
                onClick={handleSearch}
                disabled={!canSearch}
                className="flex-1 h-9"
              >
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </div>

          {/* Secondary Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="vuelta"
                checked={showVuelta}
                onCheckedChange={handleVueltaToggle}
              />
              <label htmlFor="vuelta" className="text-sm font-medium">
                Incluir vuelta
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="h-8"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Limpiar
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-2 border-t">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Filtros Avanzados</h4>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Hora desde</label>
                    <input
                      type="time"
                      value={filters.horaDesde}
                      onChange={(e) => setFilters(prev => ({ ...prev, horaDesde: e.target.value }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Hora hasta</label>
                    <input
                      type="time"
                      value={filters.horaHasta}
                      onChange={(e) => setFilters(prev => ({ ...prev, horaHasta: e.target.value }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm h-9"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Asientos mínimos</label>
                    <input
                      type="number"
                      min="1"
                      value={filters.asientosMinimos}
                      onChange={(e) => setFilters(prev => ({ ...prev, asientosMinimos: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm h-9"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {shouldSearch && canSearch && (
        <Card>
          <CardHeader>
            <CardTitle>
              Resultados de Búsqueda
              {servicios && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({servicios.reduce((total, empresa) => total + empresa.data.length, 0)} servicios encontrados)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-2">Error al buscar servicios</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            )}
            
            <ServiciosList 
               data={servicios || []} 
               isLoading={isLoading}
               origen={searchData.origen}
               destino={searchData.destino}
             />
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {!canSearch && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Buscar Pasajes</h3>
            <p className="text-muted-foreground">
              Selecciona el origen, destino y fecha para buscar servicios disponibles.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
