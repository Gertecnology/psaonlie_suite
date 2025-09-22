import { ServiceChargeMutateDrawer } from './service-charge-mutate-drawer'
import { AssignServiceChargeDialog } from './assign-service-charge-dialog'
import { useAssignServiceChargeDialog } from '../store/use-assign-service-charge-dialog'

export function ServiceChargesDialogs() {
  const { open, serviceChargeId, serviceChargeName, close } = useAssignServiceChargeDialog()

  return (
    <>
      <ServiceChargeMutateDrawer />
      <AssignServiceChargeDialog
        open={open}
        onOpenChange={close}
        serviceChargeId={serviceChargeId || ''}
        serviceChargeName={serviceChargeName || ''}
      />
    </>
  )
}
