import { MoreHorizontal, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useServiceChargeDialog } from '../store/use-service-charge-dialog'
import { useAssignServiceChargeDialog } from '../store/use-assign-service-charge-dialog'
import { useServiceChargeDeleteDialog } from '../store/use-service-charge-delete-dialog'
import { type ServiceCharge } from '../models/service-charge.model'

interface ServiceChargeRowActionsProps {
  serviceCharge: ServiceCharge
}

export function ServiceChargeRowActions({ serviceCharge }: ServiceChargeRowActionsProps) {
  const { openDialog } = useServiceChargeDialog()
  const { openDialog: openAssignDialog } = useAssignServiceChargeDialog()
  const { openDialog: openDeleteDialog } = useServiceChargeDeleteDialog()

  const handleEdit = () => {
    openDialog('edit', serviceCharge)
  }

  const handleAssign = () => {
    openAssignDialog(serviceCharge.id, serviceCharge.nombre)
  }

  const handleDelete = () => {
    openDeleteDialog(serviceCharge.id, serviceCharge.nombre)
  }

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
        <DropdownMenuItem onClick={handleEdit}>
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAssign}>
          <Building2 className='mr-2 h-4 w-4' />
          Asignar a Empresa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDelete}
          className='text-destructive'
        >
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
