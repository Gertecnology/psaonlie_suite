/* eslint-disable no-console */
import { useState } from 'react'
import { toast } from 'sonner'
import { exportVentas, downloadFile } from '../services/reports.service'
import type { ExportFilters } from '../models/reports.model'

export const useExportReports = () => {
  const [isExporting, setIsExporting] = useState(false)

  const exportReports = async (filters: ExportFilters) => {
    try {
      setIsExporting(true)
      
      // Validar que al menos un filtro esté presente
      const hasFilters = Object.values(filters).some(value => 
        value !== undefined && value !== null && value !== ''
      )
      
      if (!hasFilters) {
        toast.error('Debe seleccionar al menos un filtro para exportar')
        return
      }

      const blob = await exportVentas(filters)
      
      // Determinar el nombre del archivo
      const extension = filters.formato === 'csv' ? 'csv' : 'xlsx'
      const filename = `ventas_export.${extension}`
      
      downloadFile(blob, filename)
      
      toast.success(`Reporte exportado exitosamente en formato ${extension.toUpperCase()}`)
      
    } catch (error) {
      console.error('Error al exportar reportes:', error)
      toast.error('Error al exportar el reporte. Intente nuevamente.')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportReports,
    isExporting,
  }
}
