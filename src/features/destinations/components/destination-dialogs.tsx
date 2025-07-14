import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDestinationDeleteDialog } from '../store/use-destination-dialog'
import { deleteDestination } from '../services/destination.service'

export function DestinationDialogs() {
  const { open: isOpen, id: destinationId, closeDialog } = useDestinationDeleteDialog()

  const handleConfirm = async () => {
    if (destinationId) {
      try {
        await deleteDestination(destinationId)
        closeDialog()
        // Recargar la lista después de eliminar
        window.location.reload()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error al eliminar destino:', error)
      }
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
    />
  )
}
