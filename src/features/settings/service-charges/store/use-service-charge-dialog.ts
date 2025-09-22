import { create } from 'zustand'
import { type ServiceCharge } from '../models/service-charge.model'

interface ServiceChargeDialogState {
  open: boolean
  type: 'create' | 'edit'
  data?: ServiceCharge
  openDialog: (type: 'create' | 'edit', data?: ServiceCharge) => void
  close: () => void
}

export const useServiceChargeDialog = create<ServiceChargeDialogState>(set => ({
  open: false,
  type: 'create',
  data: undefined,
  openDialog: (type, data) => set({ open: true, type, data }),
  close: () => set({ open: false, data: undefined }),
}))
