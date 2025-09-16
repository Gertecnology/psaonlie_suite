import { create } from 'zustand'
import { type ClienteConEstadisticas } from '../models/clients.model'

interface ClientDialogState {
  open: boolean
  type: 'create' | 'edit'
  data?: ClienteConEstadisticas
  openDialog: (type: 'create' | 'edit', data?: ClienteConEstadisticas) => void
  close: () => void
}

export const useClientDialog = create<ClientDialogState>(set => ({
  open: false,
  type: 'create',
  data: undefined,
  openDialog: (type, data) => set({ open: true, type, data }),
  close: () => set({ open: false, data: undefined }),
}))
