import { create } from 'zustand'

interface ServiceChargeDeleteDialogState {
  isOpen: boolean
  serviceChargeId?: string
  serviceChargeName?: string
  openDialog: (serviceChargeId: string, serviceChargeName?: string) => void
  closeDialog: () => void
}

export const useServiceChargeDeleteDialog = create<ServiceChargeDeleteDialogState>(set => ({
  isOpen: false,
  serviceChargeId: undefined,
  serviceChargeName: undefined,
  openDialog: (serviceChargeId, serviceChargeName) => 
    set({ isOpen: true, serviceChargeId, serviceChargeName }),
  closeDialog: () => set({ isOpen: false, serviceChargeId: undefined, serviceChargeName: undefined }),
}))

