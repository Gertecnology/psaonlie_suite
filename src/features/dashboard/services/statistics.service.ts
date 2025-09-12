import { SalesStatistics, StatisticsSearchParams } from '../models/statistics.model'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Service to get complete sales statistics
 * @param params - Search parameters for filtering statistics
 * @returns Promise<SalesStatistics> - Complete statistics data
 */
export async function getSalesStatistics(params: StatisticsSearchParams): Promise<SalesStatistics> {
  // Build query parameters
  const queryParams = new URLSearchParams()

  // Add parameters if provided
  if (params.fechaDesde) queryParams.append('fechaDesde', params.fechaDesde)
  if (params.fechaHasta) queryParams.append('fechaHasta', params.fechaHasta)
  if (params.empresaId) queryParams.append('empresaId', params.empresaId)
  if (params.agruparPor) queryParams.append('agruparPor', params.agruparPor)

  const response = await fetch(`${API_URL}/api/admin/ventas/estadisticas?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado para acceder a las estadísticas')
    }
    if (response.status === 403) {
      throw new Error('Permisos insuficientes para ver estadísticas')
    }
    if (response.status === 500) {
      throw new Error('Error interno del servidor al obtener estadísticas')
    }
    throw new Error('Error al obtener estadísticas de ventas')
  }

  const result: SalesStatistics = await response.json()
  return result
}
