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
      <CardContent className="space-y-6">
        {/* Filtros Básicos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Formato de Exportación */}
          <div className="space-y-2">
            <Label htmlFor="formato">Formato de Exportación</Label>
            <Select
              value={filters.formato || 'xlsx'}
              onValueChange={(value) => updateFilter('formato', value)}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="estadoPago">Estado de Pago</Label>
            <Select
              value={filters.estadoPago || 'all'}
              onValueChange={(value) => updateFilter('estadoPago', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="estadoVenta">Estado de Venta</Label>
            <Select
              value={filters.estadoVenta || 'all'}
              onValueChange={(value) => updateFilter('estadoVenta', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="metodoPago">Método de Pago</Label>
            <Select
              value={filters.metodoPago || 'all'}
              onValueChange={(value) => updateFilter('metodoPago', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="sortBy">Ordenar por</Label>
            <Select
              value={filters.sortBy || 'fechaVenta'}
              onValueChange={(value) => updateFilter('sortBy', value)}
            >
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Dirección</Label>
            <Select
              value={filters.sortOrder || 'DESC'}
              onValueChange={(value) => updateFilter('sortOrder', value)}
            >
              <SelectTrigger>
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
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Filtros de Fecha */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha de Venta Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
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

              <div className="space-y-2">
                <Label>Fecha de Venta Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
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

              <div className="space-y-2">
                <Label>Fecha de Viaje Desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
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

              <div className="space-y-2">
                <Label>Fecha de Viaje Hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
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
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="importeMinimo">Importe Mínimo</Label>
                <Input
                  id="importeMinimo"
                  type="number"
                  placeholder="0"
                  value={filters.importeMinimo || ''}
                  onChange={(e) => updateFilter('importeMinimo', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="importeMaximo">Importe Máximo</Label>
                <Input
                  id="importeMaximo"
                  type="number"
                  placeholder="999999"
                  value={filters.importeMaximo || ''}
                  onChange={(e) => updateFilter('importeMaximo', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Filtros de Texto */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="numeroTransaccion">Número de Transacción</Label>
                <Input
                  id="numeroTransaccion"
                  placeholder="Ingrese número de transacción"
                  value={filters.numeroTransaccion || ''}
                  onChange={(e) => updateFilter('numeroTransaccion', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombreEmpresa">Nombre de Empresa</Label>
                <Input
                  id="nombreEmpresa"
                  placeholder="Ingrese nombre de empresa"
                  value={filters.nombreEmpresa || ''}
                  onChange={(e) => updateFilter('nombreEmpresa', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenciaPago">Referencia de Pago</Label>
                <Input
                  id="referenciaPago"
                  placeholder="Ingrese referencia de pago"
                  value={filters.referenciaPago || ''}
                  onChange={(e) => updateFilter('referenciaPago', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bancardTransactionId">ID Transacción Bancard</Label>
                <Input
                  id="bancardTransactionId"
                  placeholder="Ingrese ID de transacción"
                  value={filters.bancardTransactionId || ''}
                  onChange={(e) => updateFilter('bancardTransactionId', e.target.value)}
                />
              </div>
            </div>

            {/* Filtros de IDs */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="empresaId">ID de Empresa</Label>
                <Input
                  id="empresaId"
                  placeholder="Ingrese ID de empresa"
                  value={filters.empresaId || ''}
                  onChange={(e) => updateFilter('empresaId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="usuarioId">ID de Usuario</Label>
                <Input
                  id="usuarioId"
                  placeholder="Ingrese ID de usuario"
                  value={filters.usuarioId || ''}
                  onChange={(e) => updateFilter('usuarioId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clienteId">ID de Cliente</Label>
                <Input
                  id="clienteId"
                  placeholder="Ingrese ID de cliente"
                  value={filters.clienteId || ''}
                  onChange={(e) => updateFilter('clienteId', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="origenId">ID de Origen</Label>
                <Input
                  id="origenId"
                  placeholder="Ingrese ID de origen"
                  value={filters.origenId || ''}
                  onChange={(e) => updateFilter('origenId', e.target.value)}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
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
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar Filtros
          </Button>
        </div>

        {/* Información de Filtros Activos */}
        {hasActiveFilters && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
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
