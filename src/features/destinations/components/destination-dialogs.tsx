import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDestinationDeleteDialog } from '../store/use-destination-dialog'
import { useDeleteDestination } from '@/features/destinations'

export function DestinationDialogs() {
  const { open: isOpen, id: destinationId, closeDialog } = useDestinationDeleteDialog()
  const deleteDestination = useDeleteDestination()

  const handleConfirm = () => {
    if (destinationId) {
      deleteDestination.mutate(destinationId, {
        onSuccess: () => {
          closeDialog()
          // El hook ya maneja la invalidación del cache y toast notifications
        },
      })
    }
  }

  return (
    <ConfirmDialog
      destructive
      open={isOpen}
      onOpenChange={closeDialog}
      handleConfirm={handleConfirm}
      className='max-w-md'
      title={`¿Eliminar este destino?`}
      desc={
        <>
          Estás a punto de eliminar un destino. <br />
          Esta acción no se puede deshacer.
        </>
      }
      confirmText='Eliminar'
      cancelBtnText='Cancelar'
      isLoading={deleteDestination.isPending}
    />
  )
}
