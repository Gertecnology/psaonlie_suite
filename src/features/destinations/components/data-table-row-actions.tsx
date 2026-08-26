import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { IconTrash } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Destination } from '../models/destination.model'
import { useDestinationDeleteDialog } from '../store/use-destination-delete-dialog'

interface DataTableRowActionsProps {
  row: Row<Destination>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const destination = row.original

  const { openDialog: openDeleteDialog } = useDestinationDeleteDialog()

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        {/* Un enlace y no un `onClick`: se puede abrir en otra pestaña, se
            puede copiar, y el formulario tiene una dirección propia. */}
        <DropdownMenuItem asChild>
          <Link
            to='/destinations/$id/editar'
            params={{ id: destination.id }}
          >
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openDeleteDialog(destination.id)}>
          Eliminar
          <DropdownMenuShortcut>
            <IconTrash size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
