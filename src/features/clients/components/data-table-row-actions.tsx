import { Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type Row } from '@tanstack/react-table'
import { ClienteConEstadisticas } from '../models/clients.model'
import { useClientsContext } from '../context/clients-context'

interface DataTableRowActionsProps {
  row: Row<ClienteConEstadisticas>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const client = row.original
  const {
    setSelectedClient,
    setIsViewDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
  } = useClientsContext()

  const handleView = () => {
    setSelectedClient(client)
    setIsViewDialogOpen(true)
  }

  const handleEdit = () => {
    setSelectedClient(client)
    setIsEditDialogOpen(true)
  }

  const handleDelete = () => {
    setSelectedClient(client)
    setIsDeleteDialogOpen(true)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <span className='sr-only'>Abrir menú</span>
          <Eye className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleView}>
          <Eye className='mr-2 h-4 w-4' />
          Ver detalles
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className='mr-2 h-4 w-4' />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className='text-destructive'>
          <Trash2 className='mr-2 h-4 w-4' />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
