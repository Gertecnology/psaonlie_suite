import { useState } from 'react'
import { Calendar as CalendarIcon, Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import type { ExportFilters } from '../models/reports.model'
import {
  ESTADO_PAGO_OPTIONS,
  ESTADO_VENTA_OPTIONS,
  METODO_PAGO_OPTIONS,
  FORMATO_OPTIONS,
  SORT_BY_OPTIONS,
  SORT_ORDER_OPTIONS,
} from '../models/reports.model'
import { useEmpresasList } from '../../dashboard/hooks/use-empresas-list'
import { useUsers } from '../../users/hooks/use-users'
import { useClientesList } from '../../clients/hooks/use-clients'
import { useGetDestinations } from '../../destinations/hooks/use-get-destinations'

interface ExportFiltersProps {
  filters: ExportFilters
  onFiltersChange: (filters: ExportFilters) => void
  onExport: () => void
  isExporting: boolean
}

export function ExportFiltersComponent({ 
  filters, 
  onFiltersChange, 
  onExport, 
  isExporting 
}: ExportFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Fetch data from APIs
  const { data: empresasData, isLoading: isLoadingEmpresas } = useEmpresasList()
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ limit: 1000 }) // Get all users for the selector
  const { data: clientesData, isLoading: isLoadingClientes } = useClientesList({ 
    page: 1,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  }) // Get all clients for the selector
  const { data: destinosData, isLoading: isLoadingDestinos } = useGetDestinations()

  const updateFilter = (key: keyof ExportFilters, value: string | number | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Exportación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filtros Básicos */}
        <div className="grid gap-3 grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 auto-cols-fr">
          {/* Formato de Exportación */}
          <div className="space-y-1.5 w-full">
            <Label htmlFor="formato" className="text-xs sm:text-sm">Formato</Label>
            <Select
              value={filters.formato || 'xlsx'}
              onValueChange={(value) => updateFilter('formato', value)}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Seleccionar formato" />
              </SelectTrigger>
              <SelectContent>
                {FORMATO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado de Pago */}
          <div className="space-y-1.5 w-full">
            <Label htmlFor="estadoPago" className="text-xs sm:text-sm">Estado Pago</Label>
            <Select
              value={filters.estadoPago || 'all'}
              onValueChange={(value) => updateFilter('estadoPago', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADO_PAGO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado de Venta */}
          <div className="space-y-1.5 w-full">
            <Label htmlFor="estadoVenta" className="text-xs sm:text-sm">Estado Venta</Label>
            <Select
              value={filters.estadoVenta || 'all'}
              onValueChange={(value) => updateFilter('estadoVenta', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADO_VENTA_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Método de Pago */}
          <div className="space-y-1.5 w-full">
            <Label htmlFor="metodoPago" className="text-xs sm:text-sm">Método Pago</Label>
            <Select
              value={filters.metodoPago || 'all'}
              onValueChange={(value) => updateFilter('metodoPago', value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Todos los métodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                {METODO_PAGO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ordenamiento */}
          <div className="space-y-1.5 w-full">
            <Label htmlFor="sortBy" className="text-xs sm:text-sm">Ordenar por</Label>
            <Select
              value={filters.sortBy || 'fechaVenta'}
              onValueChange={(value) => updateFilter('sortBy', value)}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Seleccionar campo" />
              </SelectTrigger>
              <SelectContent>
                {SORT_BY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dirección de Ordenamiento */}
          <div className="space-y-1.5 w-full">
            <Label htmlFor="sortOrder" className="text-xs sm:text-sm">Dirección</Label>
            <Select
              value={filters.sortOrder || 'DESC'}
              onValueChange={(value) => updateFilter('sortOrder', value)}
            >
              <SelectTrigger className="h-10 w-full min-w-0">
                <SelectValue placeholder="Seleccionar dirección" />
              </SelectTrigger>
              <SelectContent>
                {SORT_ORDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Avanzados */}
        <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Filtros Avanzados</span>
              {showAdvancedFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            {/* Filtros de Fecha */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-cols-fr">
              <div className="space-y-1.5 w-full">
                <Label className="text-xs sm:text-sm">Fecha Venta Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-full min-w-0 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.fechaVentaDesde ? format(new Date(filters.fechaVentaDesde), "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.fechaVentaDesde ? new Date(filters.fechaVentaDesde) : undefined}
                      onSelect={(date) => updateFilter('fechaVentaDesde', date?.toISOString().split('T')[0])}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5 w-full">
                <Label className="text-xs sm:text-sm">Fecha de Venta Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-full min-w-0 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.fechaVentaHasta ? format(new Date(filters.fechaVentaHasta), "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.fechaVentaHasta ? new Date(filters.fechaVentaHasta) : undefined}
                      onSelect={(date) => updateFilter('fechaVentaHasta', date?.toISOString().split('T')[0])}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5 w-full">
                <Label className="text-xs sm:text-sm">Fecha de Viaje Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-full min-w-0 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.fechaViajeDesde ? format(new Date(filters.fechaViajeDesde), "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.fechaViajeDesde ? new Date(filters.fechaViajeDesde) : undefined}
                      onSelect={(date) => updateFilter('fechaViajeDesde', date?.toISOString().split('T')[0])}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5 w-full">
                <Label className="text-xs sm:text-sm">Fecha de Viaje Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 w-full min-w-0 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.fechaViajeHasta ? format(new Date(filters.fechaViajeHasta), "dd/MM/yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.fechaViajeHasta ? new Date(filters.fechaViajeHasta) : undefined}
                      onSelect={(date) => updateFilter('fechaViajeHasta', date?.toISOString().split('T')[0])}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Filtros de Importe */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 auto-cols-fr">
              <div className="space-y-1.5 w-full">
                <Label htmlFor="importeMinimo">Importe Mínimo</Label>
                <Input
                  className="h-10 w-full min-w-0"
                  id="importeMinimo"
                  type="number"
                  placeholder="0"
                  value={filters.importeMinimo || ''}
                  onChange={(e) => updateFilter('importeMinimo', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <Label htmlFor="importeMaximo">Importe Máximo</Label>
                <Input
                  className="h-10 w-full min-w-0"
                  id="importeMaximo"
                  type="number"
                  placeholder="999999"
                  value={filters.importeMaximo || ''}
                  onChange={(e) => updateFilter('importeMaximo', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Filtros de Texto */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-cols-fr">
              <div className="space-y-1.5 w-full">
                <Label htmlFor="numeroTransaccion">Número de Transacción</Label>
                <Input className="h-10 w-full min-w-0"
                  id="numeroTransaccion"
                  placeholder="Ingrese número de transacción"
                  value={filters.numeroTransaccion || ''}
                  onChange={(e) => updateFilter('numeroTransaccion', e.target.value)}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <Label htmlFor="nombreEmpresa">Nombre de Empresa</Label>
                <Input className="h-10 w-full min-w-0"
                  id="nombreEmpresa"
                  placeholder="Ingrese nombre de empresa"
                  value={filters.nombreEmpresa || ''}
                  onChange={(e) => updateFilter('nombreEmpresa', e.target.value)}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <Label htmlFor="referenciaPago">Referencia de Pago</Label>
                <Input className="h-10 w-full min-w-0"
                  id="referenciaPago"
                  placeholder="Ingrese referencia de pago"
                  value={filters.referenciaPago || ''}
                  onChange={(e) => updateFilter('referenciaPago', e.target.value)}
                />
              </div>

              <div className="space-y-1.5 w-full">
                <Label htmlFor="bancardTransactionId">ID Transacción Bancard</Label>
                <Input className="h-10 w-full min-w-0"
                  id="bancardTransactionId"
                  placeholder="Ingrese ID de transacción"
                  value={filters.bancardTransactionId || ''}
                  onChange={(e) => updateFilter('bancardTransactionId', e.target.value)}
                />
              </div>
            </div>

            {/* Filtros de Entidades */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-cols-fr">
              <div className="space-y-1.5 w-full">
                <Label htmlFor="empresaId">Empresa</Label>
                <Select
                  value={filters.empresaId || 'all'}
                  onValueChange={(value) => updateFilter('empresaId', value === 'all' ? undefined : value)}
                  disabled={isLoadingEmpresas}
                >
                  <SelectTrigger className="h-10 w-full min-w-0">
                    <SelectValue placeholder={isLoadingEmpresas ? "Cargando empresas..." : "Seleccionar empresa"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las empresas</SelectItem>
                    {empresasData?.data?.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 w-full">
                <Label htmlFor="usuarioId">Usuario</Label>
                <Select
                  value={filters.usuarioId || 'all'}
                  onValueChange={(value) => updateFilter('usuarioId', value === 'all' ? undefined : value)}
                  disabled={isLoadingUsers}
                >
                  <SelectTrigger className="h-10 w-full min-w-0">
                    <SelectValue placeholder={isLoadingUsers ? "Cargando usuarios..." : "Seleccionar usuario"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los usuarios</SelectItem>
                    {usersData?.data?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 w-full">
                <Label htmlFor="clienteId">Cliente</Label>
                <Select
                  value={filters.clienteId || 'all'}
                  onValueChange={(value) => updateFilter('clienteId', value === 'all' ? undefined : value)}
                  disabled={isLoadingClientes}
                >
                  <SelectTrigger className="h-10 w-full min-w-0">
                    <SelectValue placeholder={isLoadingClientes ? "Cargando clientes..." : "Seleccionar cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
                    {clientesData?.data?.map((clienteData) => (
                      <SelectItem key={clienteData.cliente.id} value={clienteData.cliente.id}>
                        {clienteData.cliente.nombreCompleto} ({clienteData.cliente.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 w-full">
                <Label htmlFor="origenId">Destino/Origen</Label>
                <Select
                  value={filters.origenId || 'all'}
                  onValueChange={(value) => updateFilter('origenId', value === 'all' ? undefined : value)}
                  disabled={isLoadingDestinos}
                >
                  <SelectTrigger className="h-10 w-full min-w-0">
                    <SelectValue placeholder={isLoadingDestinos ? "Cargando destinos..." : "Seleccionar destino/origen"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los destinos/orígenes</SelectItem>
                    {destinosData?.items?.map((destino) => (
                      <SelectItem key={destino.id} value={destino.id}>
                        {destino.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Botones de Acción */}
        <div className="flex flex-col xs:flex-row gap-3 pt-3 border-t">
          <Button
            onClick={onExport}
            disabled={isExporting || !hasActiveFilters}
            className="flex-1"
          >
            {isExporting ? 'Exportando...' : 'Exportar Reporte'}
          </Button>
          
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={isExporting}
            className="flex-1 xs:flex-none"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar Filtros
          </Button>
        </div>

        {/* Información de Filtros Activos */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
            <strong>Filtros activos:</strong> {Object.keys(filters).filter(key => 
              filters[key as keyof ExportFilters] !== undefined && 
              filters[key as keyof ExportFilters] !== null && 
              filters[key as keyof ExportFilters] !== ''
            ).length} filtro(s) aplicado(s)
          </div>
        )}
      </CardContent>
    </Card>
  )
}
