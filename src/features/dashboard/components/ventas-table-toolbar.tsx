import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '@/features/companies/components/data-table-view-options'
import { type Venta } from '../models/sales.model'
import { DataTableFacetedFilter } from '@/features/companies/components/data-table-faceted-filter'

const estadosPago = [
  { label: 'Pagado', value: 'PAGADO' },
  { label: 'Pendiente', value: 'PENDIENTE' },
  { label: 'Expirado', value: 'EXPIRADO' },
  { label: 'Cancelado', value: 'CANCELADO' },
  { label: 'Fallido', value: 'FALLIDO' },
  { label: 'Reembolsado', value: 'REEMBOLSADO' },
]

const metodosPago = [
  { label: 'Bancard', value: 'BANCARD' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
  { label: 'Transferencia', value: 'TRANSFERENCIA' },
  { label: 'Efectivo', value: 'EFECTIVO' },
]

interface VentasTableToolbarProps {
  table: Table<Venta>
}

export function VentasTableToolbar({ table }: VentasTableToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Buscar por transacción...'
          value={
            (table.getColumn('numeroTransaccion')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('numeroTransaccion')?.setFilterValue(event.target.value)
          }
          className='h-8 w-[150px] lg:w-[250px]'
        />
        <div className='flex gap-x-2'>
          {table.getColumn('estadoPago') && (
            <DataTableFacetedFilter
              column={table.getColumn('estadoPago')}
              title='Estado'
              options={estadosPago}
            />
          )}
          {table.getColumn('metodoPago') && (
            <DataTableFacetedFilter
              column={table.getColumn('metodoPago')}
              title='Método'
              options={metodosPago}
            />
          )}
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-8 px-2 lg:px-3'
          >
            Limpiar
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
