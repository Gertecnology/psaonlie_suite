import { useQuery } from '@tanstack/react-query'
import { getSalesStatistics } from '../services/statistics.service'
import { StatisticsSearchParams, SalesStatistics } from '../models/statistics.model'

/**
 * Hook to fetch sales statistics with caching and error handling
 * @param params - Search parameters for filtering statistics
 * @returns Query result with statistics data
 */
export function useSalesStatistics(params: StatisticsSearchParams) {
  return useQuery<SalesStatistics>({
    queryKey: ['sales-statistics', params],
    queryFn: () => getSalesStatistics(params),
    staleTime: 5 * 60 * 1000, // 5 minutos (datos menos dinámicos que servicios)
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2, // Reintentar 2 veces en caso de error
    refetchOnWindowFocus: false, // No refetch automático al cambiar de ventana
  })
}

/**
 * Hook to fetch sales statistics with automatic refetching
 * Useful for real-time dashboards
 * @param params - Search parameters for filtering statistics
 * @param refetchInterval - Interval in milliseconds for automatic refetching
 * @returns Query result with statistics data
 */
export function useSalesStatisticsRealtime(
  params: StatisticsSearchParams,
  refetchInterval: number = 30000 // 30 segundos por defecto
) {
  return useQuery<SalesStatistics>({
    queryKey: ['sales-statistics-realtime', params],
    queryFn: () => getSalesStatistics(params),
    staleTime: 1 * 60 * 1000, // 1 minuto para datos más frescos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    refetchInterval,
    refetchIntervalInBackground: true, // Continuar refetching en background
  })
}
