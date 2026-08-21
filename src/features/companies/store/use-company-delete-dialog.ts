import { create } from 'zustand'

interface CompanyDeleteDialogState {
  isOpen: boolean
  companyId?: string
  /** Se guarda para que la confirmación diga QUÉ empresa se elimina. */
  companyName?: string
  openDialog: (companyId: string, companyName: string) => void
  closeDialog: () => void
}

export const useCompanyDeleteDialog = create<CompanyDeleteDialogState>(set => ({
  isOpen: false,
  companyId: undefined,
  companyName: undefined,
  openDialog: (companyId, companyName) =>
    set({ isOpen: true, companyId, companyName }),
  closeDialog: () =>
    set({ isOpen: false, companyId: undefined, companyName: undefined }),
}))
