import { useQuery } from '@tanstack/react-query'
import { getClientesList } from '../services/clients.service'
import { ClientesSearchParams, ClientesListResponse } from '../models/clients.model'

/**
 * Hook to fetch clients list with caching and error handling
 * @param params - Search parameters for filtering clients
 * @returns Query result with clients data
 */
export function useClientesList(params: ClientesSearchParams = {}) {
  return useQuery<ClientesListResponse>({
    queryKey: ['clientes-list', params],
    queryFn: () => getClientesList(params),
    staleTime: 3 * 60 * 1000, // 3 minutos (datos moderadamente dinámicos)
    gcTime: 8 * 60 * 1000, // 8 minutos
    retry: 2, // Reintentar 2 veces en caso de error
    refetchOnWindowFocus: false, // No refetch automático al cambiar de ventana
  })
}

/**
 * Hook to fetch clients list with automatic refetching
 * Useful for real-time dashboards
 * @param params - Search parameters for filtering clients
 * @param refetchInterval - Interval in milliseconds for automatic refetching
 * @returns Query result with clients data
 */
export function useClientesListRealtime(
  params: ClientesSearchParams = {},
  refetchInterval: number = 60000 // 1 minuto por defecto
) {
  return useQuery<ClientesListResponse>({
    queryKey: ['clientes-list-realtime', params],
    queryFn: () => getClientesList(params),
    staleTime: 1 * 60 * 1000, // 1 minuto para datos más frescos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    refetchInterval,
    refetchIntervalInBackground: true, // Continuar refetching en background
  })
}
