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
import { useAgenciaDialog } from '../store/use-agencia-dialog'
import { useAgenciaDeleteDialog } from '../store/use-agencia-delete-dialog'
import { type Agencia } from '../models/agencia.model'

interface DataTableRowActionsProps {
  row: Row<Agencia>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const agencia = row.original

  const { openDialog: openEditDialog } = useAgenciaDialog()
  const { openDialog: openDeleteDialog } = useAgenciaDeleteDialog()

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
        <DropdownMenuItem onClick={() => openEditDialog('edit', agencia)}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => openDeleteDialog(agencia.id, agencia.nombre)}
        >
          Eliminar
          <DropdownMenuShortcut>
            <IconTrash size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
