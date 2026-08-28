import { Link } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type ClienteConEstadisticas } from '../models/clients.model'
import { ClientRowActions } from './client-row-actions'

/**
 * Columns for the client list.
 *
 * Siguen armadas por una función y no por una constante para que la lista de
 * columnas se pueda memoizar en la página sin que el array cambie de identidad
 * en cada render.
 */
export function crearColumnasClientes(): ColumnDef<ClienteConEstadisticas>[] {
  return [
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
      id: 'nombre',
      // El nombre vive anidado en `cliente`, así que hace falta un accessorFn:
      // sin él la columna no se puede ocultar desde el menú "Ver".
      accessorFn: (fila) =>
        `${fila.cliente.nombre} ${fila.cliente.apellido}`.trim(),
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Nombre' />
      ),
      cell: ({ row }) => {
        const cliente = row.original.cliente
        // El nombre abre la ficha: llegar a un cliente no debería exigir
        // encontrar el menú de la fila y elegir dentro de él.
        return (
          <Link
            to='/clients/$email'
            params={{ email: cliente.email }}
            className='hover:text-primary font-medium hover:underline'
          >
            {cliente.nombre} {cliente.apellido}
          </Link>
        )
      },
    },
    {
      id: 'telefono',
      accessorFn: (fila) => fila.cliente.telefono ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Nro de Teléfono' />
      ),
      cell: ({ row }) => <div>{row.original.cliente.telefono || '-'}</div>,
    },
    {
      id: 'nacionalidad',
      accessorFn: (fila) => fila.cliente.nacionalidad ?? '',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Nacionalidad' />
      ),
      cell: ({ row }) => <div>{row.original.cliente.nacionalidad || '-'}</div>,
    },
    {
      id: 'email',
      accessorFn: (fila) => fila.cliente.email,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Correo' />
      ),
      cell: ({ row }) => (
        <div className='text-sm'>{row.original.cliente.email}</div>
      ),
    },
    {
      id: 'totalVentas',
      accessorFn: (fila) => fila.estadisticasVentas.totalVentas,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Total de Compras' />
      ),
      cell: ({ row }) => (
        <div className='font-medium'>
          {row.original.estadisticasVentas.totalVentas}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => <ClientRowActions cliente={row.original} />,
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
