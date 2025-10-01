const API_URL = import.meta.env.VITE_API_URL

import type { ExportFilters } from '../models/reports.model'

export const exportVentas = async (filters: ExportFilters): Promise<Blob> => {
  // Construir query parameters
  const params = new URLSearchParams()
  
  // Agregar solo los filtros que tienen valor
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })

  const response = await fetch(`${API_URL}/admin/ventas/exportar?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return response.blob()
}

export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  
  // Determinar el nombre del archivo basado en el formato
  const extension = filename.includes('.csv') ? 'csv' : 'xlsx'
  const timestamp = new Date().toISOString().split('T')[0]
  link.download = `ventas_export_${timestamp}.${extension}`
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
