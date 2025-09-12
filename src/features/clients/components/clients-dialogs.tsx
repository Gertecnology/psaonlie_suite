import { ClientsCreateDialog } from './clients-create-dialog'
import { ClientsEditDialog } from './clients-edit-dialog'
import { ClientsDeleteDialog } from './clients-delete-dialog'
import { ClientsViewDialog } from './clients-view-dialog'

export function ClientsDialogs() {
  return (
    <>
      <ClientsCreateDialog />
      <ClientsEditDialog />
      <ClientsDeleteDialog />
      <ClientsViewDialog />
    </>
  )
}
