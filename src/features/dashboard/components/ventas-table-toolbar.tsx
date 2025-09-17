import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTableViewOptions } from '@/features/companies/components/data-table-view-options'
import { type Venta } from '../models/sales.model'
import { DataTableFacetedFilter } from '@/features/companies/components/data-table-faceted-filter'
import { ClienteSearch } from './cliente-search'
import { EmpresaSearch } from './empresa-search'
import { DateRangeFilter } from './date-range-filter'

const estadosPago = [
  { label: 'Pagado', value: 'PAGADO' },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Expirado', value: 'EXPIRADO' },
  { label: 'Cancelado', value: 'CANCELADO' },
  { label: 'Fallido', value: 'FALLIDO' },
  { label: 'Reembolsado', value: 'REEMBOLSADO' },
]

interface VentasTableToolbarProps {
  table: Table<Venta>
  onClienteFilter?: (clienteId: string | null) => void
  onEmpresaFilter?: (empresaId: string | null) => void
  onDateRangeFilter?: (fechaDesde: Date | null, fechaHasta: Date | null) => void
  clienteId?: string | null
  empresaId?: string | null
  fechaDesde?: Date | null
  fechaHasta?: Date | null
}

export function VentasTableToolbar({ 
  table, 
  onClienteFilter, 
  onEmpresaFilter, 
  onDateRangeFilter,
  clienteId, 
  empresaId,
  fechaDesde,
  fechaHasta
}: VentasTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0 || clienteId || empresaId || fechaDesde || fechaHasta

  return (
    <div className='flex flex-col gap-4'>
      {/* Filtros principales - Desktop en línea, móvil apilado */}
      <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between'>
        <div className='flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-2'>
          {/* Filtros de búsqueda */}
          <div className='flex flex-col gap-2 xl:flex-row xl:gap-2'>
            {onClienteFilter && (
              <ClienteSearch
                onClienteSelect={onClienteFilter}
                selectedClienteId={clienteId}
                placeholder="Filtrar por cliente..."
                className="w-full xl:w-[200px]"
              />
            )}
            {onEmpresaFilter && (
              <EmpresaSearch
                onEmpresaSelect={onEmpresaFilter}
                selectedEmpresaId={empresaId}
                placeholder="Filtrar por empresa..."
                className="w-full xl:w-[200px]"
              />
            )}
          </div>
          
          {/* Filtro de estado */}
          {table.getColumn('estadoPago') && (
            <div className="w-full xl:w-auto">
              <DataTableFacetedFilter
                column={table.getColumn('estadoPago')}
                title='Estado'
                options={estadosPago}
              />
            </div>
          )}

          {/* Filtros de fecha en la misma línea en desktop */}
          {onDateRangeFilter && (
            <div className='w-full xl:w-auto'>
              <DateRangeFilter
                onDateRangeChange={onDateRangeFilter}
                fechaDesde={fechaDesde}
                fechaHasta={fechaHasta}
                className="w-full xl:w-auto"
              />
            </div>
          )}
        </div>

        {/* Botón limpiar filtros */}
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
              if (onClienteFilter) {
                onClienteFilter(null)
              }
              if (onEmpresaFilter) {
                onEmpresaFilter(null)
              }
              if (onDateRangeFilter) {
                onDateRangeFilter(null, null)
              }
            }}
            className='h-8 px-2 lg:px-3 w-full xl:w-auto'
          >
            Limpiar filtros
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>

      {/* Opciones de vista */}
      <div className='flex justify-end'>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
