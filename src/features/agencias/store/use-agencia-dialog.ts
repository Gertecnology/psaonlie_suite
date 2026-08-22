import { create } from 'zustand'
import { type Agencia } from '../models/agencia.model'

interface AgenciaDialogState {
  open: boolean
  type: 'create' | 'edit'
  data?: Agencia
  openDialog: (type: 'create' | 'edit', data?: Agencia) => void
  close: () => void
}

export const useAgenciaDialog = create<AgenciaDialogState>(set => ({
  open: false,
  type: 'create',
  data: undefined,
  openDialog: (type, data) => set({ open: true, type, data }),
  close: () => set({ open: false, data: undefined }),
}))
