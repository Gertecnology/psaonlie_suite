import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type ClienteConEstadisticas } from '../models/clients.model'
import { ClientRowActions } from './client-row-actions'

interface OpcionesColumnas {
  /** Abre la pantalla de detalle de un cliente. */
  onVerDetalles: (cliente: ClienteConEstadisticas) => void
}

/**
 * Columns for the client list.
 *
 * They are built by a function so the "Ver detalles" action can reach the
 * page's handler. It used to travel through the table's `meta`, where it was
 * typed `unknown` and read back with a double cast — so nothing checked that
 * the page was still passing it, and the menu item silently disappeared when
 * it was not.
 */
export function crearColumnasClientes({
  onVerDetalles,
}: OpcionesColumnas): ColumnDef<ClienteConEstadisticas>[] {
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
        return (
          <div className='font-medium'>
            {cliente.nombre} {cliente.apellido}
          </div>
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
      cell: ({ row }) => (
        <ClientRowActions cliente={row.original} onVerDetalles={onVerDetalles} />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ]
}
