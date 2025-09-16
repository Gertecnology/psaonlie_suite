import { create } from 'zustand'
import { type ClienteConEstadisticas } from '../models/clients.model'

interface ClientPurchasesModalState {
  open: boolean
  client?: ClienteConEstadisticas
  openModal: (client: ClienteConEstadisticas) => void
  close: () => void
}

export const useClientPurchasesModal = create<ClientPurchasesModalState>(set => ({
  open: false,
  client: undefined,
  openModal: (client) => set({ open: true, client }),
  close: () => set({ open: false, client: undefined }),
}))
