import { create } from 'zustand'

interface DestinationDeleteDialogState {
  open: boolean
  id?: string
  openDialog: (id: string) => void
  close: () => void
}

/**
 * Deleting still asks first, and still asks in a dialog.
 *
 * The edit form moved to its own page because a form deserves an address; a
 * yes/no question does not. Sending "¿seguro?" to a route would add two
 * navigations to a one-click action.
 *
 * The sibling store that held the edit drawer's state is gone: the record being
 * edited now comes from the URL.
 */
export const useDestinationDeleteDialog = create<DestinationDeleteDialogState>(
  (set) => ({
    open: false,
    id: undefined,
    openDialog: (id) => set({ open: true, id }),
    close: () => set({ open: false, id: undefined }),
  }),
)
