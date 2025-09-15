import { ClientMutateDrawer } from './client-mutate-drawer'
import { ClientsDeleteDialog } from './clients-delete-dialog'
import { ClientsViewDialog } from './clients-view-dialog'

export function ClientsDialogs() {
  return (
    <>
      <ClientMutateDrawer />
      <ClientsDeleteDialog />
      <ClientsViewDialog />
    </>
  )
}
