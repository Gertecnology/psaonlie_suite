import { Eye, Filter, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEmpresasList } from '../../dashboard/hooks/use-empresas-list'
import type { ExportFilters } from '../models/reports.model'
import { ESTADO_VENTA_OPTIONS } from '../models/reports.model'

interface ReportsInlineFiltersProps {
  filters: ExportFilters
  onFiltersChange: (filters: ExportFilters) => void
  onApply: () => void
  onClear: () => void
  onOpenAdvanced: () => void
  canApply: boolean
  advancedFiltersCount: number
  advancedFilterChips: string[]
}

export function ReportsInlineFilters({
  filters,
  onFiltersChange,
  onApply,
  onClear,
  onOpenAdvanced,
  canApply,
  advancedFiltersCount,
  advancedFilterChips,
}: Readonly<ReportsInlineFiltersProps>) {
  const { data: empresasData, isLoading: isLoadingEmpresas } = useEmpresasList()

  const updateFilter = (
    key: keyof ExportFilters,
    value: string | undefined
  ) => {
    onFiltersChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    })
  }

  return (
    <Card>
      <CardHeader className='pb-0.5'>
        <CardTitle className='flex items-center justify-between text-lg'>
          <div className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filtros de Búsqueda
          </div>

          <div className='flex gap-2'>
            <Button
              variant='ghost'
              size='sm'
              className='text-muted-foreground px-0'
              onClick={onOpenAdvanced}
            >
              <Filter className='mr-2 h-4 w-4' />
              Más Filtros
              {advancedFiltersCount > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  {advancedFiltersCount}
                </Badge>
              )}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClear}
              className='bg-background border px-5 py-4'
            >
              <RotateCcw className='h-4 w-4' />
              Limpiar Todo
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_auto]'>
          <div className='space-y-2'>
            <Label className='text-muted-foreground text-xs tracking-wide uppercase'>
              Fecha desde/hasta
            </Label>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                type='date'
                value={filters.fechaVentaDesde || ''}
                onChange={(event) =>
                  updateFilter(
                    'fechaVentaDesde',
                    event.target.value || undefined
                  )
                }
              />
              <Input
                type='date'
                value={filters.fechaVentaHasta || ''}
                onChange={(event) =>
                  updateFilter(
                    'fechaVentaHasta',
                    event.target.value || undefined
                  )
                }
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label className='text-muted-foreground text-xs tracking-wide uppercase'>
              Estado de venta
            </Label>
            <Select
              value={filters.estadoVenta || 'all'}
              onValueChange={(value) =>
                updateFilter('estadoVenta', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className='w-full'>
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

          <div className='space-y-2'>
            <Label className='text-muted-foreground text-xs tracking-wide uppercase'>
              Empresa
            </Label>
            <Select
              value={filters.empresaId || 'all'}
              onValueChange={(value) =>
                updateFilter('empresaId', value === 'all' ? undefined : value)
              }
              disabled={isLoadingEmpresas}
            >
              <SelectTrigger className='w-full'>
                <SelectValue
                  placeholder={
                    isLoadingEmpresas
                      ? 'Cargando empresas...'
                      : 'Todas las empresas'
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

          <div className='self-end'>
            <Button
              onClick={onApply}
              disabled={!canApply}
              className='w-full gap-2'
            >
              <Eye className='h-4 w-4' />
              Aplicar filtro
            </Button>
          </div>
        </div>

        <div className='flex flex-wrap items-center gap-2 border-t pt-3'>
          {advancedFilterChips.map((chip) => (
            <Badge key={chip} variant='outline'>
              {chip}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
