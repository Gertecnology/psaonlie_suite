import { Edit, MoreHorizontal, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type ClienteConEstadisticas } from '../models/clients.model'
import { useClientDialog } from '../store/use-client-dialog'

interface ClientRowActionsProps {
  cliente: ClienteConEstadisticas
  onVerDetalles: (cliente: ClienteConEstadisticas) => void
}

/**
 * Row menu for the client list.
 *
 * It lives in its own file so `clients-columns.tsx` exports only the column
 * factory: a module that exports a component next to a plain function loses
 * fast refresh, which is why agencias keeps its row actions apart too.
 */
export function ClientRowActions({
  cliente,
  onVerDetalles,
}: ClientRowActionsProps) {
  const { openDialog } = useClientDialog()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>
            Abrir menú de acciones de {cliente.cliente.nombreCompleto}
          </span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onVerDetalles(cliente)}>
          <ShoppingCart className='mr-2 h-4 w-4' />
          Ver detalles
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openDialog('edit', cliente)}>
          <Edit className='mr-2 h-4 w-4' />
          Editar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
