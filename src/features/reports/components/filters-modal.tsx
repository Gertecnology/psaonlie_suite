import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar as CalendarIcon, Filter, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { useEmpresasList } from '../../dashboard/hooks/use-empresas-list'
import type { ExportFilters } from '../models/reports.model'
import {
  ESTADO_PAGO_OPTIONS,
  ESTADO_VENTA_OPTIONS,
  METODO_PAGO_OPTIONS,
  FORMATO_OPTIONS,
  SORT_BY_OPTIONS,
  SORT_ORDER_OPTIONS,
} from '../models/reports.model'
import { UsuarioSearch } from './usuario-search'
import { ClienteSearch } from './cliente-search'
import { DestinoSearch } from './destino-search'

interface FiltersModalProps {
  filters: ExportFilters
  onFiltersChange: (filters: ExportFilters) => void
  onApply: (filters: ExportFilters) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  hidePrimaryFilters?: boolean
}

export function FiltersModal({
  filters,
  onFiltersChange,
  onApply,
  isOpen,
  onOpenChange,
  hidePrimaryFilters = false,
}: Readonly<FiltersModalProps>) {
  const [localFilters, setLocalFilters] = useState<ExportFilters>(filters)

  // Obtener lista de empresas
  const { data: empresasData, isLoading: isLoadingEmpresas } = useEmpresasList()

  // Sincronizar filtros locales con los props
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateLocalFilter = (
    key: keyof ExportFilters,
    value: string | number | undefined
  ) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value === '' ? undefined : value,
    }))
  }

  const parseLocalDate = (value?: string) => {
    if (!value) return undefined
    return parseISO(value)
  }

  const formatDateForFilter = (date?: Date) => {
    if (!date) return undefined
    return format(date, 'yyyy-MM-dd')
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
    onApply(localFilters)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalFilters(filters) // Resetear a los filtros originales
    onOpenChange(false)
  }

  const activeFiltersCount = Object.entries(localFilters).filter(
    ([key, value]) => {
      if (key === 'formato' || key === 'sortBy' || key === 'sortOrder') {
        return false
      }
      return value !== undefined && value !== null && value !== ''
    }
  ).length

  const hasChanges = JSON.stringify(localFilters) !== JSON.stringify(filters)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] w-[95vw] max-w-5xl overflow-hidden flex flex-col p-0 sm:max-w-5xl md:max-w-5xl lg:max-w-5xl'>
        <div className='p-6 border-b shrink-0'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2 text-xl'>
              <Filter className='h-5 w-5 text-primary' />
              Filtros de Exportación
              {activeFiltersCount > 0 && (
                <Badge variant='secondary' className='ml-2 px-2'>
                  {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className='mt-1'>
              Configura los filtros para exportar los datos de ventas. Los
              cambios se aplicarán al hacer clic en &quot;Aplicar Filtros&quot;.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className='flex-1 overflow-y-auto p-6'>
          <div className='space-y-8 pb-4'>
            {/* Filtros Básicos */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Configuración Básica</h3>
              <div className='grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3'>
                {/* Formato de Exportación */}
                <div className='space-y-2'>
                  <Label htmlFor='formato'>Formato de Exportación</Label>
                  <Select
                    value={localFilters.formato || 'xlsx'}
                    onValueChange={(value) =>
                      updateLocalFilter('formato', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Seleccionar formato' />
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
                <div className='space-y-2'>
                  <Label htmlFor='sortBy'>Ordenar por</Label>
                  <Select
                    value={localFilters.sortBy || 'fechaVenta'}
                    onValueChange={(value) =>
                      updateLocalFilter('sortBy', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Seleccionar campo' />
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
                <div className='space-y-2'>
                  <Label htmlFor='sortOrder'>Dirección</Label>
                  <Select
                    value={localFilters.sortOrder || 'DESC'}
                    onValueChange={(value) =>
                      updateLocalFilter('sortOrder', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Seleccionar dirección' />
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
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Estados</h3>
              <div className='grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3'>
                {/* Estado de Pago */}
                <div className='space-y-2'>
                  <Label htmlFor='estadoPago'>Estado de Pago</Label>
                  <Select
                    value={localFilters.estadoPago || 'all'}
                    onValueChange={(value) =>
                      updateLocalFilter(
                        'estadoPago',
                        value === 'all' ? undefined : value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Todos los estados' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos los estados</SelectItem>
                      {ESTADO_PAGO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!hidePrimaryFilters && (
                  <div className='space-y-2'>
                    <Label htmlFor='estadoVenta'>Estado de Venta</Label>
                    <Select
                      value={localFilters.estadoVenta || 'all'}
                      onValueChange={(value) =>
                        updateLocalFilter(
                          'estadoVenta',
                          value === 'all' ? undefined : value
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Todos los estados' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>Todos los estados</SelectItem>
                        {ESTADO_VENTA_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Método de Pago */}
                <div className='space-y-2'>
                  <Label htmlFor='metodoPago'>Método de Pago</Label>
                  <Select
                    value={localFilters.metodoPago || 'all'}
                    onValueChange={(value) =>
                      updateLocalFilter(
                        'metodoPago',
                        value === 'all' ? undefined : value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Todos los métodos' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>Todos los métodos</SelectItem>
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
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Fechas</h3>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {!hidePrimaryFilters && (
                  <>
                    <div className='space-y-2'>
                      <Label>Fecha de Venta Desde</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className='w-full justify-start text-left font-normal'
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {localFilters.fechaVentaDesde
                              ? format(
                                  parseLocalDate(
                                    localFilters.fechaVentaDesde
                                  ) ?? new Date(),
                                  'dd/MM/yyyy',
                                  { locale: es }
                                )
                              : 'Seleccionar fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={parseLocalDate(
                              localFilters.fechaVentaDesde
                            )}
                            onSelect={(date) =>
                              updateLocalFilter(
                                'fechaVentaDesde',
                                formatDateForFilter(date)
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className='space-y-2'>
                      <Label>Fecha de Venta Hasta</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant='outline'
                            className='w-full justify-start text-left font-normal'
                          >
                            <CalendarIcon className='mr-2 h-4 w-4' />
                            {localFilters.fechaVentaHasta
                              ? format(
                                  parseLocalDate(
                                    localFilters.fechaVentaHasta
                                  ) ?? new Date(),
                                  'dd/MM/yyyy',
                                  { locale: es }
                                )
                              : 'Seleccionar fecha'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={parseLocalDate(
                              localFilters.fechaVentaHasta
                            )}
                            onSelect={(date) =>
                              updateLocalFilter(
                                'fechaVentaHasta',
                                formatDateForFilter(date)
                              )
                            }
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </>
                )}

                {/* Fecha Viaje Desde */}
                <div className='space-y-2'>
                  <Label>Fecha de Viaje Desde</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-start text-left font-normal'
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {localFilters.fechaViajeDesde
                          ? format(
                              parseLocalDate(localFilters.fechaViajeDesde) ??
                                new Date(),
                              'dd/MM/yyyy',
                              { locale: es }
                            )
                          : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={parseLocalDate(localFilters.fechaViajeDesde)}
                        onSelect={(date) =>
                          updateLocalFilter(
                            'fechaViajeDesde',
                            formatDateForFilter(date)
                          )
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Fecha Viaje Hasta */}
                <div className='space-y-2'>
                  <Label>Fecha de Viaje Hasta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        className='w-full justify-start text-left font-normal'
                      >
                        <CalendarIcon className='mr-2 h-4 w-4' />
                        {localFilters.fechaViajeHasta
                          ? format(
                              parseLocalDate(localFilters.fechaViajeHasta) ??
                                new Date(),
                              'dd/MM/yyyy',
                              { locale: es }
                            )
                          : 'Seleccionar fecha'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={parseLocalDate(localFilters.fechaViajeHasta)}
                        onSelect={(date) =>
                          updateLocalFilter(
                            'fechaViajeHasta',
                            formatDateForFilter(date)
                          )
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Filtros de Importe */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Importes</h3>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='importeMinimo'>Importe Mínimo</Label>
                  <Input
                    id='importeMinimo'
                    type='number'
                    min={0}
                    placeholder='0'
                    value={localFilters.importeMinimo || ''}
                    onChange={(e) =>
                      updateLocalFilter(
                        'importeMinimo',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='importeMaximo'>Importe Máximo</Label>
                  <Input
                    id='importeMaximo'
                    type='number'
                    min={0}
                    placeholder='999999'
                    value={localFilters.importeMaximo || ''}
                    onChange={(e) =>
                      updateLocalFilter(
                        'importeMaximo',
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* Filtros de Texto */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Búsqueda por Texto</h3>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='numeroTransaccion'>
                    Número de Transacción
                  </Label>
                  <Input
                    id='numeroTransaccion'
                    placeholder='Ingrese número de transacción'
                    value={localFilters.numeroTransaccion || ''}
                    onChange={(e) =>
                      updateLocalFilter('numeroTransaccion', e.target.value)
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='nombreEmpresa'>Nombre de Empresa</Label>
                  <Input
                    id='nombreEmpresa'
                    placeholder='Ingrese nombre de empresa'
                    value={localFilters.nombreEmpresa || ''}
                    onChange={(e) =>
                      updateLocalFilter('nombreEmpresa', e.target.value)
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='referenciaPago'>Referencia de Pago</Label>
                  <Input
                    id='referenciaPago'
                    placeholder='Ingrese referencia de pago'
                    value={localFilters.referenciaPago || ''}
                    onChange={(e) =>
                      updateLocalFilter('referenciaPago', e.target.value)
                    }
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='bancardTransactionId'>
                    ID Transacción Bancard
                  </Label>
                  <Input
                    id='bancardTransactionId'
                    placeholder='Ingrese ID de transacción'
                    value={localFilters.bancardTransactionId || ''}
                    onChange={(e) =>
                      updateLocalFilter('bancardTransactionId', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Filtros de Entidades */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold'>Entidades</h3>
              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                {!hidePrimaryFilters && (
                  <div className='space-y-2'>
                    <Label htmlFor='empresaId'>Empresa</Label>
                    <Select
                      value={localFilters.empresaId || 'all'}
                      onValueChange={(value) =>
                        updateLocalFilter(
                          'empresaId',
                          value === 'all' ? undefined : value
                        )
                      }
                      disabled={isLoadingEmpresas}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingEmpresas
                              ? 'Cargando empresas...'
                              : 'Seleccionar empresa'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>Todas las empresas</SelectItem>
                        {empresasData?.data?.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className='space-y-2'>
                  <Label htmlFor='usuarioId'>Usuario</Label>
                  <UsuarioSearch
                    value={localFilters.usuarioId}
                    onValueChange={(id) => updateLocalFilter('usuarioId', id)}
                    placeholder='Buscar usuario...'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='clienteId'>Cliente</Label>
                  <ClienteSearch
                    value={localFilters.clienteId}
                    onValueChange={(id) => updateLocalFilter('clienteId', id)}
                    placeholder='Buscar cliente...'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='origenId'>Origen</Label>
                  <DestinoSearch
                    value={localFilters.origenId}
                    onValueChange={(id) => updateLocalFilter('origenId', id)}
                    placeholder='Buscar origen...'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='destinoId'>Destino</Label>
                  <DestinoSearch
                    value={localFilters.destinoId}
                    onValueChange={(id) => updateLocalFilter('destinoId', id)}
                    placeholder='Buscar destino...'
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className='p-6 border-t shrink-0 flex items-center justify-between bg-muted/20'>
          <Button
            variant='outline'
            onClick={clearAllFilters}
            className='flex items-center gap-2'
          >
            <RotateCcw className='h-4 w-4' />
            Limpiar Todo
          </Button>

          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={handleCancel}>
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              disabled={!hasChanges}
              className='min-w-30'
            >
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
