import { ClientMutateDrawer } from './client-mutate-drawer'
import { ClientsDeleteDialog } from './clients-delete-dialog'
import { ClientsViewDialog } from './clients-view-dialog'
import { ClientPurchasesModal } from './client-purchases-modal'
import { useClientPurchasesModal } from '../store/use-client-purchases-modal'

export function ClientsDialogs() {
  const { open, client, close } = useClientPurchasesModal()

  return (
    <>
      <ClientMutateDrawer />
      <ClientsDeleteDialog />
      <ClientsViewDialog />
      <ClientPurchasesModal 
        open={open} 
        onOpenChange={close} 
        client={client} 
      />
    </>
  )
}
