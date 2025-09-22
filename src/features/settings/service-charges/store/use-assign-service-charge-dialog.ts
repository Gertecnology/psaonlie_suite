import { create } from 'zustand'

interface AssignServiceChargeDialogState {
  open: boolean
  serviceChargeId: string | null
  serviceChargeName: string | null
  openDialog: (serviceChargeId: string, serviceChargeName: string) => void
  close: () => void
}

export const useAssignServiceChargeDialog = create<AssignServiceChargeDialogState>(set => ({
  open: false,
  serviceChargeId: null,
  serviceChargeName: null,
  openDialog: (serviceChargeId, serviceChargeName) => set({ 
    open: true, 
    serviceChargeId, 
    serviceChargeName 
  }),
  close: () => set({ 
    open: false, 
    serviceChargeId: null, 
    serviceChargeName: null 
  }),
}))
