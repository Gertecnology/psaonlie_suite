import { useQuery } from '@tanstack/react-query'
import { getEmpresasList } from '../services/empresas.service'
import { EmpresasSearchParams, EmpresasListResponse } from '../models/empresas.model'

/**
 * Hook to fetch empresas list with caching and error handling
 * @param params - Search parameters for filtering empresas
 * @returns Query result with empresas data
 */
export function useEmpresasList(params: EmpresasSearchParams = {}) {
  return useQuery<EmpresasListResponse>({
    queryKey: ['empresas-list', params],
    queryFn: () => getEmpresasList(params),
    staleTime: 5 * 60 * 1000, // 5 minutos (datos menos dinámicos)
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2, // Reintentar 2 veces en caso de error
    refetchOnWindowFocus: false, // No refetch automático al cambiar de ventana
  })
}

/**
 * Hook to fetch empresas list with automatic refetching
 * Useful for real-time dashboards
 * @param params - Search parameters for filtering empresas
 * @param refetchInterval - Interval in milliseconds for automatic refetching
 * @returns Query result with empresas data
 */
export function useEmpresasListRealtime(
  params: EmpresasSearchParams = {},
  refetchInterval: number = 300000 // 5 minutos por defecto
) {
  return useQuery<EmpresasListResponse>({
    queryKey: ['empresas-list-realtime', params],
    queryFn: () => getEmpresasList(params),
    staleTime: 2 * 60 * 1000, // 2 minutos para datos más frescos
    gcTime: 8 * 60 * 1000, // 8 minutos
    retry: 2,
    refetchInterval,
    refetchIntervalInBackground: true, // Continuar refetching en background
  })
}
