import { create } from 'zustand'
import { type FilaAgencia } from '../models/agencia.model'

interface AgenciaDialogState {
  open: boolean
  type: 'create' | 'edit'
  /**
   * La fila de la tabla, no una `Agencia` pelada: el formulario necesita
   * `comisionDelPadre` para mostrar qué comisión cobra de verdad una agencia
   * que la hereda.
   */
  data?: FilaAgencia
  openDialog: (type: 'create' | 'edit', data?: FilaAgencia) => void
  close: () => void
}

export const useAgenciaDialog = create<AgenciaDialogState>(set => ({
  open: false,
  type: 'create',
  data: undefined,
  openDialog: (type, data) => set({ open: true, type, data }),
  close: () => set({ open: false, data: undefined }),
}))
