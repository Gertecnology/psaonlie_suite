'use client'

import { useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteUser } from '../hooks/use-users'
import { User } from '../models/user'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('')
  const deleteUser = useDeleteUser()

  const handleDelete = () => {
    if (value.trim() !== currentRow.email) return

    deleteUser.mutate(currentRow.id, {
      onSuccess: () => {
        onOpenChange(false)
        setValue('')
        import('sonner').then(({ toast }) => {
          toast.success('Usuario eliminado', {
            description: `El usuario ${currentRow.email} ha sido eliminado correctamente.`,
            duration: 3000,
          })
        })
      },
      onError: (error: unknown) => {
        import('sonner').then(({ toast }) => {
          let message = 'Ha ocurrido un error al eliminar el usuario.'
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

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.email || deleteUser.isPending}
      title={
        <span className='text-destructive'>
          <IconAlertTriangle
            className='stroke-destructive mr-1 inline-block'
            size={18}
          />{' '}
          Eliminar Usuario
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            ¿Estás seguro de que quieres eliminar{' '}
            <span className='font-bold'>{currentRow.email}</span>?
            <br />
            Esta acción eliminará permanentemente al usuario con los roles{' '}
            <span className='font-bold'>
              {currentRow.roles.map(role => role.name).join(', ').toUpperCase()}
            </span>{' '}
            del sistema. Esta acción no se puede deshacer.
          </p>

          <Label className='my-2'>
            Email:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder='Ingresa el email para confirmar la eliminación.'
              disabled={deleteUser.isPending}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>¡Advertencia!</AlertTitle>
            <AlertDescription>
              Por favor ten cuidado, esta operación no se puede revertir.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText={deleteUser.isPending ? 'Eliminando...' : 'Eliminar'}
      destructive
    />
  )
}
