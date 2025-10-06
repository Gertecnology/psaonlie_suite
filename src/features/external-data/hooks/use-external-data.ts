import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalDataService, ExternalDataFilters, ExternalDataItem } from '../services/external-data.service'

interface UseExternalDataOptions {
  filters?: ExternalDataFilters
  pageSize?: number
  searchTerm?: string
}

/**
 * Hook para manejar la obtención y paginación de datos externos
 */
export function useExternalData(options: UseExternalDataOptions = {}) {
  const { filters = {}, pageSize = 50, searchTerm = '' } = options
  const [currentPage, setCurrentPage] = useState(1)

  // Query para obtener todos los datos
  const {
    data: allData,
    isLoading,
    error,
    refetch,
  } = useQuery<ExternalDataItem[]>({
    queryKey: ['external-data', filters],
    queryFn: () => ExternalDataService.getExternalData(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  })

  // Filtrar datos por búsqueda
  const filteredData = useMemo(() => {
    if (!allData) return []
    return ExternalDataService.filterDataBySearch(allData, searchTerm)
  }, [allData, searchTerm])

  // Aplicar paginación
  const paginatedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return {
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      }
    }

    return ExternalDataService.paginateData(filteredData, currentPage, pageSize)
  }, [filteredData, currentPage, pageSize])

  // Resetear página cuando cambian los filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), searchTerm])

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToNextPage = () => {
    if (paginatedData.hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPreviousPage = () => {
    if (paginatedData.hasPreviousPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  return {
    // Datos paginados
    data: paginatedData.items,
    totalItems: paginatedData.totalItems,
    totalPages: paginatedData.totalPages,
    currentPage: paginatedData.currentPage,
    hasNextPage: paginatedData.hasNextPage,
    hasPreviousPage: paginatedData.hasPreviousPage,
    
    // Estados
    isLoading,
    error,
    
    // Acciones
    goToPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    
    // Información adicional
    allDataCount: allData?.length || 0,
    filteredDataCount: filteredData.length,
  }
}
