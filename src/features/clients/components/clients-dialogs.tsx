import { useClientPurchasesModal } from '../store/use-client-purchases-modal'
import { ClientPurchasesModal } from './client-purchases-modal'
import { ClientsDeleteDialog } from './clients-delete-dialog'

/**
 * What is left of the client list's overlays.
 *
 * The create/edit drawer moved to `/clients/nuevo` and `/clients/$email/editar`,
 * and the read-only "Detalles del Cliente" dialog is gone: it duplicated
 * `client-details-screen`, which shows the same data plus the purchase history.
 * Deleting still asks first, and still asks in a dialog — a yes/no question does
 * not deserve two navigations.
 */
export function ClientsDialogs() {
  const { open, client, close } = useClientPurchasesModal()

  return (
    <>
      <ClientsDeleteDialog />
      <ClientPurchasesModal open={open} onOpenChange={close} client={client} />
    </>
  )
}
