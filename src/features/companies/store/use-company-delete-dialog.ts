import { create } from 'zustand'

interface CompanyDeleteDialogState {
  isOpen: boolean
  companyId?: string
  openDialog: (companyId: string) => void
  closeDialog: () => void
}

export const useCompanyDeleteDialog = create<CompanyDeleteDialogState>(set => ({
  isOpen: false,
  companyId: undefined,
  openDialog: companyId => set({ isOpen: true, companyId }),
  closeDialog: () => set({ isOpen: false, companyId: undefined }),
})) 