import { ConfirmDialog } from '@/components/confirm-dialog'
import { useAgenciaDeleteDialog } from '../store/use-agencia-delete-dialog'
import { useEliminarAgencia } from '../hooks/use-eliminar-agencia'

export function AgenciaDialogs() {
  const { isOpen, agenciaId, agenciaNombre, closeDialog } =
    useAgenciaDeleteDialog()
  const eliminarAgencia = useEliminarAgencia()

  const handleConfirm = () => {
    if (!agenciaId) return
    // El diálogo se cierra recién cuando la petición termina, para que el
    // usuario vea el estado de carga y no dispare el borrado dos veces.
    eliminarAgencia.mutate(agenciaId, { onSettled: () => closeDialog() })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && !eliminarAgencia.isPending) closeDialog()
  }

  return (
    <ConfirmDialog
      destructive
      open={isOpen}
      onOpenChange={handleOpenChange}
      handleConfirm={handleConfirm}
      isLoading={eliminarAgencia.isPending}
      className='max-w-md'
      title='¿Eliminar empresa?'
      desc={
        <>
          Estás a punto de eliminar la empresa{' '}
          <span className='font-semibold'>
            {agenciaNombre ?? 'seleccionada'}
          </span>
          . Sus agencias se eliminan con ella. Esta acción no se puede deshacer.
        </>
      }
      confirmText={eliminarAgencia.isPending ? 'Eliminando...' : 'Eliminar'}
      cancelBtnText='Cancelar'
    />
  )
}
