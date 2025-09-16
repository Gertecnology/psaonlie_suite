import { create } from 'zustand'
import { type ClienteConEstadisticas } from '../models/clients.model'

interface ClientDetailsScreenState {
  isOpen: boolean
  client?: ClienteConEstadisticas
  openScreen: (client: ClienteConEstadisticas) => void
  close: () => void
}

export const useClientDetailsScreen = create<ClientDetailsScreenState>(set => ({
  isOpen: false,
  client: undefined,
  openScreen: (client) => set({ isOpen: true, client }),
  close: () => set({ isOpen: false, client: undefined }),
}))
