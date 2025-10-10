import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Filter, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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

interface FiltersModalProps {
  filters: ExportFilters
  onFiltersChange: (filters: ExportFilters) => void
  onApply: () => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export function FiltersModal({ 
  filters, 
  onFiltersChange, 
  onApply,
  isOpen,
  onOpenChange
}: FiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<ExportFilters>(filters)

  // Fetch data from APIs
  const { data: empresasData, isLoading: isLoadingEmpresas } = useEmpresasList()
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({ limit: 1000 })
  const { data: clientesData, isLoading: isLoadingClientes } = useClientesList({ 
    page: 1,
    limit: 100,
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  })
  const { data: destinosData, isLoading: isLoadingDestinos } = useGetDestinations()

  // Sincronizar filtros locales con los props
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateLocalFilter = (key: keyof ExportFilters, value: string | number | undefined) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }))
  }

  const clearAllFilters = () => {
    setLocalFilters({
      formato: 'xlsx',
      sortBy: 'fechaVenta',
      sortOrder: 'DESC',
    })
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onApply()
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalFilters(filters) // Resetear a los filtros originales
    onOpenChange(false)
  }

  const hasActiveFilters = Object.entries(localFilters).some(([key, value]) => {
    // Excluir campos por defecto
    if (key === 'formato' || key === 'sortBy' || key === 'sortOrder') {
      return false
    }
    return value !== undefined && value !== null && value !== ''
  })

  const activeFiltersCount = Object.entries(localFilters).filter(([key, value]) => {
    if (key === 'formato' || key === 'sortBy' || key === 'sortOrder') {
      return false
    }
    return value !== undefined && value !== null && value !== ''
  }).length

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Exportación
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} activo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Configura los filtros para exportar los datos de ventas. Los cambios se aplicarán al hacer clic en "Aplicar Filtros".
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6">
            {/* Filtros Básicos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuración Básica</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {/* Formato de Exportación */}
                <div className="space-y-2">
                  <Label htmlFor="formato">Formato de Exportación</Label>
                  <Select
                    value={localFilters.formato || 'xlsx'}
                    onValueChange={(value) => updateLocalFilter('formato', value)}
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

                {/* Ordenamiento */}
                <div className="space-y-2">
                  <Label htmlFor="sortBy">Ordenar por</Label>
                  <Select
                    value={localFilters.sortBy || 'fechaVenta'}
                    onValueChange={(value) => updateLocalFilter('sortBy', value)}
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
                    value={localFilters.sortOrder || 'DESC'}
                    onValueChange={(value) => updateLocalFilter('sortOrder', value)}
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
            </div>

            {/* Filtros de Estado */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Estados</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {/* Estado de Pago */}
                <div className="space-y-2">
                  <Label htmlFor="estadoPago">Estado de Pago</Label>
                  <Select
                    value={localFilters.estadoPago || 'all'}
                    onValueChange={(value) => updateLocalFilter('estadoPago', value === 'all' ? undefined : value)}
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
                    value={localFilters.estadoVenta || 'all'}
                    onValueChange={(value) => updateLocalFilter('estadoVenta', value === 'all' ? undefined : value)}
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
                    value={localFilters.metodoPago || 'all'}
                    onValueChange={(value) => updateLocalFilter('metodoPago', value === 'all' ? undefined : value)}
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
              </div>
            </div>

            {/* Filtros de Fecha */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Fechas</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {/* Fecha Venta Desde */}
                <div className="space-y-2">
                  <Label>Fecha de Venta Desde</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.fechaVentaDesde ? 
                          format(new Date(localFilters.fechaVentaDesde), "dd/MM/yyyy", { locale: es }) : 
                          "Seleccionar fecha"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.fechaVentaDesde ? new Date(localFilters.fechaVentaDesde) : undefined}
                        onSelect={(date) => updateLocalFilter('fechaVentaDesde', date?.toISOString().split('T')[0])}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Fecha Venta Hasta */}
                <div className="space-y-2">
                  <Label>Fecha de Venta Hasta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.fechaVentaHasta ? 
                          format(new Date(localFilters.fechaVentaHasta), "dd/MM/yyyy", { locale: es }) : 
                          "Seleccionar fecha"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.fechaVentaHasta ? new Date(localFilters.fechaVentaHasta) : undefined}
                        onSelect={(date) => updateLocalFilter('fechaVentaHasta', date?.toISOString().split('T')[0])}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Fecha Viaje Desde */}
                <div className="space-y-2">
                  <Label>Fecha de Viaje Desde</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.fechaViajeDesde ? 
                          format(new Date(localFilters.fechaViajeDesde), "dd/MM/yyyy", { locale: es }) : 
                          "Seleccionar fecha"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.fechaViajeDesde ? new Date(localFilters.fechaViajeDesde) : undefined}
                        onSelect={(date) => updateLocalFilter('fechaViajeDesde', date?.toISOString().split('T')[0])}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Fecha Viaje Hasta */}
                <div className="space-y-2">
                  <Label>Fecha de Viaje Hasta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localFilters.fechaViajeHasta ? 
                          format(new Date(localFilters.fechaViajeHasta), "dd/MM/yyyy", { locale: es }) : 
                          "Seleccionar fecha"
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localFilters.fechaViajeHasta ? new Date(localFilters.fechaViajeHasta) : undefined}
                        onSelect={(date) => updateLocalFilter('fechaViajeHasta', date?.toISOString().split('T')[0])}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Filtros de Importe */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Importes</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="importeMinimo">Importe Mínimo</Label>
                  <Input
                    id="importeMinimo"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={localFilters.importeMinimo || ''}
                    onChange={(e) => updateLocalFilter('importeMinimo', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="importeMaximo">Importe Máximo</Label>
                  <Input
                    id="importeMaximo"
                    type="number"
                    min={0}
                    placeholder="999999"
                    value={localFilters.importeMaximo || ''}
                    onChange={(e) => updateLocalFilter('importeMaximo', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
            </div>

            {/* Filtros de Texto */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Búsqueda por Texto</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="numeroTransaccion">Número de Transacción</Label>
                  <Input
                    id="numeroTransaccion"
                    placeholder="Ingrese número de transacción"
                    value={localFilters.numeroTransaccion || ''}
                    onChange={(e) => updateLocalFilter('numeroTransaccion', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nombreEmpresa">Nombre de Empresa</Label>
                  <Input
                    id="nombreEmpresa"
                    placeholder="Ingrese nombre de empresa"
                    value={localFilters.nombreEmpresa || ''}
                    onChange={(e) => updateLocalFilter('nombreEmpresa', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referenciaPago">Referencia de Pago</Label>
                  <Input
                    id="referenciaPago"
                    placeholder="Ingrese referencia de pago"
                    value={localFilters.referenciaPago || ''}
                    onChange={(e) => updateLocalFilter('referenciaPago', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bancardTransactionId">ID Transacción Bancard</Label>
                  <Input
                    id="bancardTransactionId"
                    placeholder="Ingrese ID de transacción"
                    value={localFilters.bancardTransactionId || ''}
                    onChange={(e) => updateLocalFilter('bancardTransactionId', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Filtros de Entidades */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Entidades</h3>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="empresaId">Empresa</Label>
                  <Select
                    value={localFilters.empresaId || 'all'}
                    onValueChange={(value) => updateLocalFilter('empresaId', value === 'all' ? undefined : value)}
                    disabled={isLoadingEmpresas}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="usuarioId">Usuario</Label>
                  <Select
                    value={localFilters.usuarioId || 'all'}
                    onValueChange={(value) => updateLocalFilter('usuarioId', value === 'all' ? undefined : value)}
                    disabled={isLoadingUsers}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="clienteId">Cliente</Label>
                  <Select
                    value={localFilters.clienteId || 'all'}
                    onValueChange={(value) => updateLocalFilter('clienteId', value === 'all' ? undefined : value)}
                    disabled={isLoadingClientes}
                  >
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="origenId">Destino/Origen</Label>
                  <Select
                    value={localFilters.origenId || 'all'}
                    onValueChange={(value) => updateLocalFilter('origenId', value === 'all' ? undefined : value)}
                    disabled={isLoadingDestinos}
                  >
                    <SelectTrigger>
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
            </div>
          </div>
        </ScrollArea>

        {/* Footer con botones */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={clearAllFilters}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar Todo
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button onClick={handleApply} disabled={!hasActiveFilters}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
