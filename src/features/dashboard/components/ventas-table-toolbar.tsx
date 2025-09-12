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
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <div className='flex gap-x-2'>
          {onClienteFilter && (
            <ClienteSearch
              onClienteSelect={onClienteFilter}
              selectedClienteId={clienteId}
              placeholder="Filtrar por cliente..."
              className="w-[200px]"
            />
          )}
          {onEmpresaFilter && (
            <EmpresaSearch
              onEmpresaSelect={onEmpresaFilter}
              selectedEmpresaId={empresaId}
              placeholder="Filtrar por empresa..."
              className="w-[200px]"
            />
          )}
          {table.getColumn('estadoPago') && (
            <DataTableFacetedFilter
              column={table.getColumn('estadoPago')}
              title='Estado'
              options={estadosPago}
            />
          )}
          {onDateRangeFilter && (
            <DateRangeFilter
              onDateRangeChange={onDateRangeFilter}
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
            />
          )}
        </div>
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
            className='h-8 px-2 lg:px-3'
          >
            Limpiar filtros
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
