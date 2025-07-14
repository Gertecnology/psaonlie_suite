import { create } from 'zustand'

import { type Company } from '../models/company.model'

interface CompanyDialogState {
  open: boolean
  type: 'create' | 'edit'
  data?: Company
  openDialog: (type: 'create' | 'edit', data?: Company) => void
  close: () => void
}

export const useCompanyDialog = create<CompanyDialogState>(set => ({
  open: false,
  type: 'create',
  data: undefined,
  openDialog: (type, data) => set({ open: true, type, data }),
  close: () => set({ open: false, data: undefined }),
})) 