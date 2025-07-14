import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
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
import { useDestinationDialog, useDestinationDeleteDialog } from '../store/use-destination-dialog'
import { type Destination } from '../models/destination.model'

interface DataTableRowActionsProps {
  row: Row<Destination>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const destination = row.original

  const { openDialog: openEditDialog } = useDestinationDialog()
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
        <DropdownMenuItem onClick={() => openEditDialog('edit', { ...destination, id: destination.id, paradasHomologadasIds: destination.paradasHomologadas?.map((p) => p.id) || [] })}>
          Editar
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
