import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient, updateClient, deleteClient } from '../services/clients.service'
import { CreateClientFormValues, UpdateClientFormValues } from '../models/clients.model'

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateClientFormValues) => createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-list'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, data }: { email: string; data: UpdateClientFormValues }) => 
      updateClient(email, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-list'] })
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-list'] })
    },
  })
}
