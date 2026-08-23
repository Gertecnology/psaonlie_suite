import { MoreHorizontal, Building2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAssignServiceChargeDialog } from '../store/use-assign-service-charge-dialog'
import { useServiceChargeDeleteDialog } from '../store/use-service-charge-delete-dialog'
import { type ServiceCharge } from '../models/service-charge.model'

interface ServiceChargeRowActionsProps {
  serviceCharge: ServiceCharge
}

export function ServiceChargeRowActions({
  serviceCharge,
}: ServiceChargeRowActionsProps) {
  const { openDialog: openAssignDialog } = useAssignServiceChargeDialog()
  const { openDialog: openDeleteDialog } = useServiceChargeDeleteDialog()

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
        {/* `asChild` para que la opción sea un enlace real: se abre en otra
            pestaña con el clic del medio y tiene dirección propia. */}
        <DropdownMenuItem asChild>
          <Link
            to='/settings/service-charges/$id/editar'
            params={{ id: serviceCharge.id }}
          >
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            openAssignDialog(serviceCharge.id, serviceCharge.nombre)
          }
        >
          <Building2 className='mr-2 h-4 w-4' />
          Asignar a empresa
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            openDeleteDialog(serviceCharge.id, serviceCharge.nombre)
          }
          className='text-destructive'
        >
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
