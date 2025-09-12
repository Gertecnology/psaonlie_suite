import { useQuery } from '@tanstack/react-query'
import { getClientesList, getClienteById } from '../services/clients.service'
import { ClientesSearchParams } from '../models/clients.model'

export function useClientesList(params: ClientesSearchParams) {
  return useQuery({
    queryKey: ['clientes-list', params],
    queryFn: () => getClientesList(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

export function useClienteById(id: string) {
  return useQuery({
    queryKey: ['cliente', id],
    queryFn: () => getClienteById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

