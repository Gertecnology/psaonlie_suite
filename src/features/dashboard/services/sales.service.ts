import { VentasListResponse, VentasSearchParams } from '../models/sales.model'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Service to get paginated list of sales with filters
 * @param params - Search parameters for filtering sales
 * @returns Promise<VentasListResponse> - Paginated sales data
 */
export async function getVentasList(params: VentasSearchParams = {}): Promise<VentasListResponse> {
  // Build query parameters
  const queryParams = new URLSearchParams()

  // Add parameters if provided
  if (params.estadoPago) queryParams.append('estadoPago', params.estadoPago)
  if (params.estadoVenta) queryParams.append('estadoVenta', params.estadoVenta)
  if (params.estadoAsientos) queryParams.append('estadoAsientos', params.estadoAsientos)
  if (params.metodoPago) queryParams.append('metodoPago', params.metodoPago)
  if (params.empresaId) queryParams.append('empresaId', params.empresaId)
  if (params.usuarioId) queryParams.append('usuarioId', params.usuarioId)
  if (params.clienteId) queryParams.append('clienteId', params.clienteId)
  if (params.origenId) queryParams.append('origenId', params.origenId)
  if (params.destinoId) queryParams.append('destinoId', params.destinoId)
  if (params.numeroTransaccion) queryParams.append('numeroTransaccion', params.numeroTransaccion)
  if (params.nombreEmpresa) queryParams.append('nombreEmpresa', params.nombreEmpresa)
  if (params.nombreEmpresaExterna) queryParams.append('nombreEmpresaExterna', params.nombreEmpresaExterna)
  if (params.fechaVentaDesde) queryParams.append('fechaVentaDesde', params.fechaVentaDesde)
  if (params.fechaVentaHasta) queryParams.append('fechaVentaHasta', params.fechaVentaHasta)
  if (params.fechaViajeDesde) queryParams.append('fechaViajeDesde', params.fechaViajeDesde)
  if (params.fechaViajeHasta) queryParams.append('fechaViajeHasta', params.fechaViajeHasta)
  if (params.importeMinimo !== undefined) queryParams.append('importeMinimo', params.importeMinimo.toString())
  if (params.importeMaximo !== undefined) queryParams.append('importeMaximo', params.importeMaximo.toString())
  if (params.referenciaPago) queryParams.append('referenciaPago', params.referenciaPago)
  if (params.bancardTransactionId) queryParams.append('bancardTransactionId', params.bancardTransactionId)
  if (params.page !== undefined) queryParams.append('page', params.page.toString())
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const response = await fetch(`${API_URL}/api/admin/ventas/lista?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado para acceder a la lista de ventas')
    }
    if (response.status === 403) {
      throw new Error('Permisos insuficientes para ver ventas')
    }
    if (response.status === 500) {
      throw new Error('Error interno del servidor al obtener ventas')
    }
    throw new Error('Error al obtener lista de ventas')
  }

  const result: VentasListResponse = await response.json()
  return result
}
