import { useState } from 'react'
import { IconTrash, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type FilaAgencia } from '../models/agencia.model'
import { useEliminarAgencias } from '../hooks/use-eliminar-agencias'

/** Cuántos nombres se listan en la confirmación antes de resumir el resto. */
const MAX_NAMES_SHOWN = 8

interface AgenciaBulkActionsProps {
  /**
   * Sólo empresas: la tabla impide seleccionar agencias hijas, porque no se
   * borran de a una. Se van con su empresa por `ON DELETE CASCADE`.
   */
  seleccionadas: FilaAgencia[]
  onClearSelection: () => void
}

/**
 * Barra de acciones masivas. Sólo se renderiza cuando hay filas seleccionadas.
 *
 * La confirmación enumera las empresas por nombre: es una acción destructiva y
 * el usuario tiene que poder verificar QUÉ está por borrar, no sólo cuántas.
 */
export function AgenciaBulkActions({
  seleccionadas,
  onClearSelection,
}: AgenciaBulkActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const eliminarAgencias = useEliminarAgencias()

  const count = seleccionadas.length
  if (count === 0) return null

  const namesShown = seleccionadas.slice(0, MAX_NAMES_SHOWN)
  const remaining = count - namesShown.length
  const totalHijas = seleccionadas.reduce(
    (total, empresa) => total + empresa.cantidadHijas,
    0,
  )

  const handleConfirm = () => {
    eliminarAgencias.mutate(
      seleccionadas.map((agencia) => agencia.id),
      {
        onSettled: () => {
          setIsConfirmOpen(false)
          // La selección se limpia siempre: las filas borradas ya no existen y
          // las que fallaron deben volver a elegirse de forma consciente.
          onClearSelection()
        },
      },
    )
  }

  return (
    <>
      <div className='bg-muted/60 flex flex-col gap-2 rounded-md border px-3 py-2 sm:flex-row sm:items-center sm:justify-between'>
        <span className='text-sm font-medium'>
          {count === 1
            ? '1 empresa seleccionada'
            : `${count} empresas seleccionadas`}
        </span>
        <div className='flex items-center gap-2'>
          <Button
            variant='ghost'
            size='sm'
            className='h-8'
            onClick={onClearSelection}
            disabled={eliminarAgencias.isPending}
          >
            <IconX size={16} className='mr-1' />
            Limpiar selección
          </Button>
          <Button
            variant='destructive'
            size='sm'
            className='h-8'
            onClick={() => setIsConfirmOpen(true)}
            disabled={eliminarAgencias.isPending}
          >
            <IconTrash size={16} className='mr-1' />
            {eliminarAgencias.isPending
              ? 'Eliminando...'
              : 'Eliminar seleccionadas'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        destructive
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!eliminarAgencias.isPending) setIsConfirmOpen(open)
        }}
        handleConfirm={handleConfirm}
        isLoading={eliminarAgencias.isPending}
        className='max-w-md'
        title={
          count === 1 ? '¿Eliminar 1 empresa?' : `¿Eliminar ${count} empresas?`
        }
        desc={
          <>
            <p>
              Se eliminarán {count === 1 ? 'la siguiente empresa' : `las siguientes ${count} empresas`}:
            </p>
            <ul className='mt-2 max-h-48 list-disc overflow-y-auto pl-5 text-sm'>
              {namesShown.map((agencia) => (
                <li key={agencia.id}>{agencia.nombre}</li>
              ))}
              {remaining > 0 && (
                <li className='list-none pl-0 font-medium'>
                  y {remaining} más...
                </li>
              )}
            </ul>
            {totalHijas > 0 && (
              <p className='mt-2'>
                Se {totalHijas === 1 ? 'eliminará también su' : 'eliminarán también sus'}{' '}
                <span className='font-semibold'>
                  {totalHijas === 1 ? '1 agencia' : `${totalHijas} agencias`}
                </span>
                .
              </p>
            )}
            <p className='mt-2'>Esta acción no se puede deshacer.</p>
          </>
        }
        confirmText={
          eliminarAgencias.isPending ? 'Eliminando...' : 'Eliminar'
        }
        cancelBtnText='Cancelar'
      />
    </>
  )
}
