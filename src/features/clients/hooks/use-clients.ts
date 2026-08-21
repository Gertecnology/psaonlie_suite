import { useQuery } from '@tanstack/react-query'
import { getClientesList, getClientePorEmail } from '../services/clients.service'
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

/**
 * El backend identifica al cliente por email (`GET /api/clientes/:email`),
 * no por id.
 */
export function useClientePorEmail(email: string) {
  return useQuery({
    queryKey: ['cliente', email],
    queryFn: () => getClientePorEmail(email),
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

