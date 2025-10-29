import { ConfirmDialog } from '@/components/confirm-dialog'
import { ServiceChargeMutateDrawer } from './service-charge-mutate-drawer'
import { AssignServiceChargeDialog } from './assign-service-charge-dialog'
import { useAssignServiceChargeDialog } from '../store/use-assign-service-charge-dialog'
import { useServiceChargeDeleteDialog } from '../store/use-service-charge-delete-dialog'
import { useDeleteServiceCharge } from '../hooks/use-delete-service-charge'

export function ServiceChargesDialogs() {
  const { open, serviceChargeId, serviceChargeName, close } = useAssignServiceChargeDialog()
  const { isOpen, serviceChargeId: deleteServiceChargeId, serviceChargeName: deleteServiceChargeName, closeDialog } = useServiceChargeDeleteDialog()
  const deleteServiceCharge = useDeleteServiceCharge()

  const handleConfirmDelete = () => {
    if (deleteServiceChargeId) {
      deleteServiceCharge.mutate(deleteServiceChargeId, {
        onSuccess: () => {
          closeDialog()
        },
      })
    }
  }

  return (
    <>
      <ServiceChargeMutateDrawer />
      <AssignServiceChargeDialog
        open={open}
        onOpenChange={close}
        serviceChargeId={serviceChargeId || ''}
        serviceChargeName={serviceChargeName || ''}
      />
      <ConfirmDialog
        destructive
        open={isOpen}
        onOpenChange={closeDialog}
        handleConfirm={handleConfirmDelete}
        className='max-w-md'
        title='¿Eliminar este cargo por servicio?'
        desc={
          <>
            Estás a punto de eliminar el cargo por servicio{' '}
            {deleteServiceChargeName && (
              <strong>{deleteServiceChargeName}</strong>
            )}
            .<br />
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
