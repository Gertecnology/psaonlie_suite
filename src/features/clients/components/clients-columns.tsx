import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Trash2, ShoppingCart } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ClienteConEstadisticas } from '../models/clients.model'
import { useClientDialog } from '../store/use-client-dialog'
import { useClientsContext } from '../context/clients-context'

interface ClientRowActionsProps {
  client: ClienteConEstadisticas
  onViewDetails?: (client: ClienteConEstadisticas) => void
}

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
    id: 'nombre',
    header: 'Nombre',
    cell: ({ row }) => {
      const cliente = row.original.cliente
      return (
        <div className='font-medium'>{cliente.nombre} {cliente.apellido}</div>
      )
    },
  },
  {
    id: 'telefono',
    header: 'Nro de Teléfono',
    cell: ({ row }) => {
      const telefono = row.original.cliente.telefono
      return <div>{telefono || '-'}</div>
    },
  },
  {
    id: 'nacionalidad',
    header: 'Nacionalidad',
    cell: ({ row }) => {
      const nacionalidad = row.original.cliente.nacionalidad
      return <div>{nacionalidad || '-'}</div>
    },
  },
  {
    id: 'email',
    header: 'Correo',
    cell: ({ row }) => {
      const email = row.original.cliente.email
      return <div className='text-sm'>{email}</div>
    },
  },
  {
    id: 'totalVentas',
    header: 'Total de Compras',
    cell: ({ row }) => {
      const totalVentas = row.original.estadisticasVentas.totalVentas
      return <div className='font-medium'>{totalVentas}</div>
    },
  },
  {
    id: 'actions',
    header: 'Acciones',
    cell: ({ row, table }) => {
      const client = row.original
      const onViewDetails = (table.options.meta as unknown as { onViewClientDetails?: (client: ClienteConEstadisticas) => void })?.onViewClientDetails
      return <ClientRowActions client={client} onViewDetails={onViewDetails} />
    },
    enableSorting: false,
    enableHiding: false,
  },
]

// eslint-disable-next-line react-refresh/only-export-components
function ClientRowActions({ client, onViewDetails }: ClientRowActionsProps) {
  const { openDialog } = useClientDialog()
  const { setSelectedClient, setIsDeleteDialogOpen } = useClientsContext()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Abrir menú</span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        {onViewDetails && (
          <DropdownMenuItem
            onClick={() => onViewDetails(client)}
          >
            <ShoppingCart className='mr-2 h-4 w-4' />
            Ver detalles
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => openDialog('edit', client)}
        >
          <Edit className='mr-2 h-4 w-4' />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setSelectedClient(client)
            setIsDeleteDialogOpen(true)
          }}
          className='text-destructive'
        >
          <Trash2 className='mr-2 h-4 w-4' />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}