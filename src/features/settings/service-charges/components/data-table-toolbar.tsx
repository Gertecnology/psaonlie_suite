import { type Table } from '@tanstack/react-table'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '@/features/settings/service-charges/components/data-table-view-options'
import { DataTableFacetedFilter } from '@/features/settings/service-charges/components/data-table-faceted-filter'
import { useServiceChargeDialog } from '@/features/settings/service-charges/store/use-service-charge-dialog'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const { openDialog } = useServiceChargeDialog()
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className='flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0'>
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        <Input
          placeholder='Filtrar por nombre...'
          value={(table.getColumn('nombre')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('nombre')?.setFilterValue(event.target.value)
          }
          className='h-8 w-full sm:w-[200px] lg:w-[250px]'
        />
        <div className='flex flex-wrap gap-2'>
          {table.getColumn('tipoAplicacion') && (
            <DataTableFacetedFilter
              column={table.getColumn('tipoAplicacion')}
              title='Tipo'
              options={[
                { label: 'Porcentual', value: 'PORCENTUAL' },
                { label: 'Fijo', value: 'FIJO' },
              ]}
            />
          )}
          {table.getColumn('esGlobal') && (
            <DataTableFacetedFilter
              column={table.getColumn('esGlobal')}
              title='Global'
              options={[
                { label: 'Sí', value: 'true' },
                { label: 'No', value: 'false' },
              ]}
            />
          )}
          {table.getColumn('activo') && (
            <DataTableFacetedFilter
              column={table.getColumn('activo')}
              title='Estado'
              options={[
                { label: 'Activo', value: 'true' },
                { label: 'Inactivo', value: 'false' },
              ]}
            />
          )}
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <X className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <div className='flex items-center space-x-2'>
        <DataTableViewOptions table={table} />
        <Button
          onClick={() => openDialog('create')}
          className='h-8'
        >
          <Plus className='mr-2 h-4 w-4' />
          <span className='hidden sm:inline'>Nuevo Cargo</span>
          <span className='sm:hidden'>Nuevo</span>
        </Button>
      </div>
    </div>
  )
}
