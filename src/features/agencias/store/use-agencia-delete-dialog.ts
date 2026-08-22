import { create } from 'zustand'

interface AgenciaDeleteDialogState {
  isOpen: boolean
  agenciaId?: string
  /** Se guarda para que la confirmación diga QUÉ agencia se elimina. */
  agenciaNombre?: string
  openDialog: (agenciaId: string, agenciaNombre: string) => void
  closeDialog: () => void
}

export const useAgenciaDeleteDialog = create<AgenciaDeleteDialogState>(set => ({
  isOpen: false,
  agenciaId: undefined,
  agenciaNombre: undefined,
  openDialog: (agenciaId, agenciaNombre) =>
    set({ isOpen: true, agenciaId, agenciaNombre }),
  closeDialog: () =>
    set({ isOpen: false, agenciaId: undefined, agenciaNombre: undefined }),
}))
