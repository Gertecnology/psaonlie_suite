import { createContext, useContext, useState, ReactNode } from 'react'
import { ClienteConEstadisticas } from '../models/clients.model'

interface ClientsContextType {
  selectedClient: ClienteConEstadisticas | null
  setSelectedClient: (client: ClienteConEstadisticas | null) => void
  isCreateDialogOpen: boolean
  setIsCreateDialogOpen: (open: boolean) => void
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (open: boolean) => void
  isViewDialogOpen: boolean
  setIsViewDialogOpen: (open: boolean) => void
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

interface ClientsProviderProps {
  children: ReactNode
}

export function ClientsProvider({ children }: ClientsProviderProps) {
  const [selectedClient, setSelectedClient] = useState<ClienteConEstadisticas | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  return (
    <ClientsContext.Provider
      value={{
        selectedClient,
        setSelectedClient,
        isCreateDialogOpen,
        setIsCreateDialogOpen,
        isEditDialogOpen,
        setIsEditDialogOpen,
        isDeleteDialogOpen,
        setIsDeleteDialogOpen,
        isViewDialogOpen,
        setIsViewDialogOpen,
      }}
    >
      {children}
    </ClientsContext.Provider>
  )
}

export function useClientsContext() {
  const context = useContext(ClientsContext)
  if (context === undefined) {
    throw new Error('useClientsContext must be used within a ClientsProvider')
  }
  return context
}
