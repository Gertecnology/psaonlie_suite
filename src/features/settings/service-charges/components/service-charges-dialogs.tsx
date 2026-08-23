import { ConfirmDialog } from '@/components/confirm-dialog'
import { AssignServiceChargeDialog } from './assign-service-charge-dialog'
import { useAssignServiceChargeDialog } from '../store/use-assign-service-charge-dialog'
import { useServiceChargeDeleteDialog } from '../store/use-service-charge-delete-dialog'
import { useDeleteServiceCharge } from '../hooks/use-delete-service-charge'

/**
 * What is left of the list's overlays once the form moved to its own page:
 * a delete confirmation and a one-step assignment. Both are decisions taken on
 * a record already chosen, not data to fill in.
 */
export function ServiceChargesDialogs() {
  const {
    open: assignOpen,
    serviceChargeId,
    serviceChargeName,
    close: closeAssign,
  } = useAssignServiceChargeDialog()
  const {
    isOpen: deleteOpen,
    serviceChargeId: deleteId,
    serviceChargeName: deleteName,
    closeDialog: closeDelete,
  } = useServiceChargeDeleteDialog()
  const deleteServiceCharge = useDeleteServiceCharge()

  const handleConfirmDelete = () => {
    if (!deleteId) return

    deleteServiceCharge.mutate(deleteId, { onSuccess: closeDelete })
  }

  return (
    <>
      <AssignServiceChargeDialog
        open={assignOpen}
        onClose={closeAssign}
        serviceChargeId={serviceChargeId ?? ''}
        serviceChargeName={serviceChargeName ?? ''}
      />
      <ConfirmDialog
        destructive
        open={deleteOpen}
        onOpenChange={closeDelete}
        handleConfirm={handleConfirmDelete}
        className='max-w-md'
        title='¿Eliminar este cargo por servicio?'
        desc={
          <>
            Estás a punto de eliminar el cargo por servicio{' '}
            {deleteName && <strong>{deleteName}</strong>}.<br />
            Esta acción no se puede deshacer.
          </>
        }
        confirmText='Eliminar'
        cancelBtnText='Cancelar'
        isLoading={deleteServiceCharge.isPending}
      />
    </>
  )
}
