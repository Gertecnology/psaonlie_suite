import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { ClienteConEstadisticas } from '../models/clients.model'

export const columns: ColumnDef<ClienteConEstadisticas>[] = [
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
    accessorKey: 'cliente.nombre',
    header: 'Nombre',
    cell: ({ row }) => {
      const cliente = row.original.cliente
      return (
        <div className='font-medium'>{cliente.nombre} {cliente.apellido}</div>
      )
    },
  },
  {
    accessorKey: 'cliente.telefono',
    header: 'Nro de Teléfono',
    cell: ({ row }) => {
      const telefono = row.original.cliente.telefono
      return <div>{telefono || '-'}</div>
    },
  },
  {
    accessorKey: 'cliente.nacionalidad',
    header: 'Nacionalidad',
    cell: ({ row }) => {
      const nacionalidad = row.original.cliente.nacionalidad
      return <div>{nacionalidad || '-'}</div>
    },
  },
  {
    accessorKey: 'cliente.email',
    header: 'Correo',
    cell: ({ row }) => {
      const email = row.original.cliente.email
      return <div className='text-sm'>{email}</div>
    },
  },
  {
    accessorKey: 'estadisticasVentas.totalVentas',
    header: 'Total de Compras',
    cell: ({ row }) => {
      const totalVentas = row.original.estadisticasVentas.totalVentas
      return <div className='font-medium'>{totalVentas}</div>
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row: _row }) => {
      return <div>Acciones</div>
    },
    enableSorting: false,
    enableHiding: false,
  },
]