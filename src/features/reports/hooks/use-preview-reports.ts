/* eslint-disable no-console */
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getPreviewData, getTotalCount, type PreviewResponse } from '../services/preview.service'
import type { ExportFilters } from '../models/reports.model'

export const usePreviewReports = () => {
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Función para cargar previsualización
  const loadPreview = useCallback(async (filters: ExportFilters) => {
    try {
      setIsLoadingPreview(true)
      setError(null)

      // Verificar que hay al menos un filtro activo
      const hasActiveFilters = Object.values(filters).some(value => 
        value !== undefined && value !== null && value !== ''
      )

      if (!hasActiveFilters) {
        setPreviewData(null)
        setTotalCount(0)
        return
      }

      // Cargar datos de previsualización y conteo total en paralelo
      const [previewResponse, count] = await Promise.all([
        getPreviewData(filters, 20),
        getTotalCount(filters)
      ])

      setPreviewData(previewResponse)
      setTotalCount(count)

    } catch (err) {
      console.error('Error al cargar previsualización:', err)
      setError('Error al cargar la previsualización de datos')
      setPreviewData(null)
      setTotalCount(0)
      toast.error('Error al cargar la previsualización')
    } finally {
      setIsLoadingPreview(false)
    }
  }, [])

  // Función para limpiar previsualización
  const clearPreview = useCallback(() => {
    setPreviewData(null)
    setTotalCount(0)
    setError(null)
  }, [])

  // Función para refrescar previsualización
  const refreshPreview = useCallback((filters: ExportFilters) => {
    loadPreview(filters)
  }, [loadPreview])

  return {
    previewData,
    totalCount,
    isLoadingPreview,
    error,
    loadPreview,
    clearPreview,
    refreshPreview,
  }
}
