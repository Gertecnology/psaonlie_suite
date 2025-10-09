import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ExternalDataService, ExternalDataFilters, PaginatedExternalDataResponse } from '../services/external-data.service'

interface UseExternalDataOptions {
  filters?: ExternalDataFilters
  pageSize?: number
  searchTerm?: string
}

/**
 * Hook para manejar la obtención y paginación de datos externos
 */
export function useExternalData(options: UseExternalDataOptions = {}) {
  const { filters = {}, pageSize = 10, searchTerm = '' } = options
  const [currentPage, setCurrentPage] = useState(1)

  // Memoizar los filtros de consulta incluyendo paginación
  const queryFilters = useMemo(() => ({
    ...filters,
    page: currentPage,
    limit: pageSize,
    // Si hay término de búsqueda, usarlo como filtro de empresa
    ...(searchTerm && { empresa: searchTerm }),
  }), [filters, currentPage, pageSize, searchTerm])

  // Query para obtener datos paginados
  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery<PaginatedExternalDataResponse>({
    queryKey: ['external-data', queryFilters],
    queryFn: () => ExternalDataService.getExternalData(queryFilters),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
  })

  // Extraer datos de la respuesta
  const data = response?.data?.items || []
  const totalItems = response?.data?.total || 0
  const totalPages = response?.data?.totalPages || 0
  const hasNextPage = currentPage < totalPages
  const hasPreviousPage = currentPage > 1

  // Resetear página cuando cambian los filtros o búsqueda
  useEffect(() => {
    setCurrentPage(1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), searchTerm])

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const goToPreviousPage = () => {
    if (hasPreviousPage) {
      setCurrentPage(prev => prev - 1)
    }
  }

  return {
    // Datos paginados
    data,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    
    // Estados
    isLoading,
    error,
    
    // Acciones
    goToPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
  }
}
