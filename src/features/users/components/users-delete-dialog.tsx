'use client'

import { useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { showSubmittedData } from '@/utils/show-submitted-data'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { User } from '../models/user'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('')

  const handleDelete = () => {
    if (value.trim() !== currentRow.email) return

    onOpenChange(false)
    showSubmittedData(currentRow, 'El siguiente usuario ha sido eliminado:')
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.email}
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
      confirmText='Eliminar'
      destructive
    />
  )
}
