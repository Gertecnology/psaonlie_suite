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
import { useDeleteServiceCharge } from '../hooks/use-delete-service-charge'
import { type ServiceCharge } from '../models/service-charge.model'

interface ServiceChargeRowActionsProps {
  serviceCharge: ServiceCharge
}

export function ServiceChargeRowActions({ serviceCharge }: ServiceChargeRowActionsProps) {
  const { openDialog } = useServiceChargeDialog()
  const { openDialog: openAssignDialog } = useAssignServiceChargeDialog()
  const deleteServiceCharge = useDeleteServiceCharge()

  const handleEdit = () => {
    openDialog('edit', serviceCharge)
  }

  const handleAssign = () => {
    openAssignDialog(serviceCharge.id, serviceCharge.nombre)
  }

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que quieres eliminar este cargo por servicio?')) {
      deleteServiceCharge.mutate(serviceCharge.id, {
        onSuccess: () => {
          import('sonner').then(({ toast }) => {
            toast.success('Cargo por servicio eliminado', {
              description: 'El cargo por servicio se ha eliminado correctamente.',
              duration: 3000,
            })
          })
        },
        onError: (error: unknown) => {
          import('sonner').then(({ toast }) => {
            let message = 'Ha ocurrido un error al eliminar el cargo por servicio.'
            if (error instanceof Error) {
              message = error.message
            } else if (typeof error === 'string') {
              message = error
            }
            toast.error('Error al eliminar', {
              description: message,
              duration: 3000,
            })
          })
        },
      })
    }
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
