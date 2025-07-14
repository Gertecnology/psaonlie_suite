import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type Destination } from '../models/destination.model'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { Link } from '@tanstack/react-router'

export const destinationColumns: ColumnDef<Destination>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Seleccionar todo'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Seleccionar fila'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'nombre',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Nombre' />
    ),
    cell: ({ row }) => {
      const id = String(row.original.id)
      return (
        <div className='flex space-x-2'>
          <Link
            to="/destinations/$id"
            params={{ id }}
            className='max-w-32 truncate font-medium cursor-pointer sm:max-w-72 md:max-w-[31rem] hover:text-blue-800'
          >
            {row.getValue('nombre')}
          </Link>
        </div>
      )
    },
  },
  {
    accessorKey: 'activo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Estado' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('activo')
      return (
        <Badge variant={isActive ? 'default' : 'destructive'}>
          {isActive ? 'Activo' : 'Inactivo'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(String(row.getValue(id)))
    },
  },
  {
    accessorKey: 'cantidadParadas',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Cantidad de paradas' />
    ),
    cell: ({ row }) => {
      const cantidad = row.original.cantidadParadas || 0;
      return (
        <div className='text-start'>
          <Badge variant='secondary'>{cantidad}</Badge>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
