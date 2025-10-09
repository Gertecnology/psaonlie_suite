const API_URL = import.meta.env.VITE_API_URL

import type { ExportFilters } from '../models/reports.model'

// Interface para los datos de previsualización
export interface PreviewData {
  id: string
  numeroTransaccion: string
  fechaVenta: string
  fechaViaje: string
  cliente: {
    nombreCompleto: string
    email: string
  }
  empresa: {
    nombre: string
  }
  origen: string
  destino: string
  importeTotal: number
  estadoPago: string
  estadoVenta: string
  metodoPago: string
  referenciaPago?: string
}

// Interface para la respuesta de previsualización
export interface PreviewResponse {
  data: PreviewData[]
  total: number
  hasMore: boolean
}

export const getPreviewData = async (
  filters: ExportFilters,
  limit: number = 20
): Promise<PreviewResponse> => {
  // Construir query parameters
  const params = new URLSearchParams()
  
  // Agregar solo los filtros que tienen valor
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })
  
  // Agregar parámetros de paginación para previsualización
  params.append('limit', String(limit))
  params.append('preview', 'true')

  const response = await fetch(`${API_URL}/api/admin/ventas/preview?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Error al obtener datos de previsualización')
  }

  return response.json()
}

// Función para obtener solo el conteo total
export const getTotalCount = async (filters: ExportFilters): Promise<number> => {
  const params = new URLSearchParams()
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })
  
  params.append('countOnly', 'true')

  const response = await fetch(`${API_URL}/api/admin/ventas/count?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Error al obtener conteo total')
  }

  const result = await response.json()
  return result.total
}
