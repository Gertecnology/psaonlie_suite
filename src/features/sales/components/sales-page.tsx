import { useState, useMemo } from 'react'
import { Search, Filter, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ParadaSearch } from './parada-search'
import { DateFilters } from './date-filters'
import { ServiciosList } from './servicios-list'
import { useGetServicios } from '../hooks/use-get-servicios'
import type { SearchFormData, SearchFilters } from '../models/sales.model'

export function SalesPage() {
  const [searchData, setSearchData] = useState<SearchFormData>({
    origen: null,
    destino: null,
    fechaIda: null,
    fechaVuelta: null,
  })
  
  const [showVuelta, setShowVuelta] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
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
  })

  const handleSearch = () => {
    // The search is automatically triggered by the useGetServicios hook
    // when searchParams changes
  }

  const handleClear = () => {
    setSearchData({
      origen: null,
      destino: null,
      fechaIda: null,
      fechaVuelta: null,
    })
    setShowVuelta(false)
    setFilters({
      horaDesde: '08:00',
      horaHasta: '22:00',
      asientosMinimos: 2,
    })
  }

  const canSearch = searchData.origen && searchData.destino && searchData.fechaIda

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar Pasajes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Origin and Destination */}
          <div className="grid gap-4 md:grid-cols-2">
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
          </div>

          <Separator />

          {/* Date Filters */}
          <DateFilters
            fechaIda={searchData.fechaIda}
            fechaVuelta={searchData.fechaVuelta}
            onFechaIdaChange={(fechaIda) => setSearchData(prev => ({ ...prev, fechaIda }))}
            onFechaVueltaChange={(fechaVuelta) => setSearchData(prev => ({ ...prev, fechaVuelta }))}
            onVueltaToggle={setShowVuelta}
            showVuelta={showVuelta}
          />

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>

            <Button 
              onClick={handleSearch}
              disabled={!canSearch}
              className="min-w-[120px]"
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Filtros Avanzados</h4>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hora desde</label>
                    <input
                      type="time"
                      value={filters.horaDesde}
                      onChange={(e) => setFilters(prev => ({ ...prev, horaDesde: e.target.value }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hora hasta</label>
                    <input
                      type="time"
                      value={filters.horaHasta}
                      onChange={(e) => setFilters(prev => ({ ...prev, horaHasta: e.target.value }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Asientos mínimos</label>
                    <input
                      type="number"
                      min="1"
                      value={filters.asientosMinimos}
                      onChange={(e) => setFilters(prev => ({ ...prev, asientosMinimos: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {canSearch && (
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
