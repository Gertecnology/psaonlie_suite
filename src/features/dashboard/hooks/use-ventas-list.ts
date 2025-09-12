import { useQuery } from '@tanstack/react-query'
import { getVentasList } from '../services/sales.service'
import { VentasSearchParams, VentasListResponse } from '../models/sales.model'

/**
 * Hook to fetch sales list with caching and error handling
 * @param params - Search parameters for filtering sales
 * @returns Query result with sales data
 */
export function useVentasList(params: VentasSearchParams = {}) {
  return useQuery<VentasListResponse>({
    queryKey: ['ventas-list', params],
    queryFn: () => getVentasList(params),
    staleTime: 2 * 60 * 1000, // 2 minutos (datos dinámicos)
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2, // Reintentar 2 veces en caso de error
    refetchOnWindowFocus: false, // No refetch automático al cambiar de ventana
  })
}

/**
 * Hook to fetch sales list with automatic refetching
 * Useful for real-time dashboards
 * @param params - Search parameters for filtering sales
 * @param refetchInterval - Interval in milliseconds for automatic refetching
 * @returns Query result with sales data
 */
export function useVentasListRealtime(
  params: VentasSearchParams = {},
  refetchInterval: number = 30000 // 30 segundos por defecto
) {
  return useQuery<VentasListResponse>({
    queryKey: ['ventas-list-realtime', params],
    queryFn: () => getVentasList(params),
    staleTime: 30 * 1000, // 30 segundos para datos más frescos
    gcTime: 2 * 60 * 1000, // 2 minutos
    retry: 2,
    refetchInterval,
    refetchIntervalInBackground: true, // Continuar refetching en background
  })
}
