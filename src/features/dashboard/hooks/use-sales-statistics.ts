import { useQuery } from '@tanstack/react-query'
import { getSalesStatistics } from '../services/statistics.service'
import { StatisticsSearchParams, SalesStatistics } from '../models/statistics.model'

/**
 * Función para obtener las fechas por defecto (año actual hasta 10 años en el futuro)
 * @returns Objeto con fechaDesde y fechaHasta del rango por defecto
 */
const getDefaultDateRange = (): { fechaDesde: string; fechaHasta: string } => {
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // Primer día del año actual (1 de enero)
  const firstDay = new Date(currentYear, 0, 1) // 0 = enero
  // Último día dentro de 10 años (31 de diciembre)
  const lastDay = new Date(currentYear + 10, 11, 31) // 11 = diciembre
  
  // Formatear fechas como YYYY-MM-DD
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }
  
  return {
    fechaDesde: formatDate(firstDay),
    fechaHasta: formatDate(lastDay)
  }
}

/**
 * Hook to fetch sales statistics with caching and error handling
 * Si no se proporcionan parámetros, usa automáticamente el rango por defecto (año actual hasta 10 años)
 * @param params - Search parameters for filtering statistics (opcional)
 * @returns Query result with statistics data
 */
export function useSalesStatistics(params: StatisticsSearchParams = {}) {
  // Si no hay parámetros o no hay fechas, usar el rango por defecto
  const finalParams = (!params.fechaDesde || !params.fechaHasta) 
    ? { ...params, ...getDefaultDateRange() }
    : params

  return useQuery<SalesStatistics>({
    queryKey: ['sales-statistics', finalParams],
    queryFn: () => getSalesStatistics(finalParams),
    staleTime: 5 * 60 * 1000, // 5 minutos (datos menos dinámicos que servicios)
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2, // Reintentar 2 veces en caso de error
    refetchOnWindowFocus: false, // No refetch automático al cambiar de ventana
  })
}

/**
 * Hook to fetch sales statistics with automatic refetching
 * Useful for real-time dashboards
 * Si no se proporcionan parámetros, usa automáticamente el rango por defecto (año actual hasta 10 años)
 * @param params - Search parameters for filtering statistics (opcional)
 * @param refetchInterval - Interval in milliseconds for automatic refetching
 * @returns Query result with statistics data
 */
export function useSalesStatisticsRealtime(
  params: StatisticsSearchParams = {},
  refetchInterval: number = 30000 // 30 segundos por defecto
) {
  // Si no hay parámetros o no hay fechas, usar el rango por defecto
  const finalParams = (!params.fechaDesde || !params.fechaHasta) 
    ? { ...params, ...getDefaultDateRange() }
    : params

  return useQuery<SalesStatistics>({
    queryKey: ['sales-statistics-realtime', finalParams],
    queryFn: () => getSalesStatistics(finalParams),
    staleTime: 1 * 60 * 1000, // 1 minuto para datos más frescos
    gcTime: 5 * 60 * 1000, // 5 minutos
    retry: 2,
    refetchInterval,
    refetchIntervalInBackground: true, // Continuar refetching en background
  })
}
