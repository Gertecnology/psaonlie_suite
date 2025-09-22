import { useQuery } from '@tanstack/react-query'
import { getPaises, type PaisData, type PaisesResponse } from '../services/paises.service'

export function useGetPaises(empresaId?: string) {
  return useQuery<PaisesResponse>({
    queryKey: ['paises', empresaId],
    queryFn: () => getPaises(empresaId),
    staleTime: 10 * 60 * 1000, // 10 minutos (datos relativamente estáticos)
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 2,
  })
}

// Hook auxiliar para obtener solo los países exitosos de todas las empresas
export function useGetPaisesDisponibles(empresaId?: string) {
  const { data: paisesResponse, isLoading, error } = useGetPaises(empresaId)
  
  const paisesDisponibles: PaisData[] = []
  
  if (paisesResponse) {
    paisesResponse.forEach(empresa => {
      if (empresa.success && empresa.data.length > 0) {
        paisesDisponibles.push(...empresa.data)
      }
    })
  }
  
  // Eliminar duplicados basándose en el código del país
  const paisesUnicos = paisesDisponibles.filter((pais, index, self) => 
    index === self.findIndex(p => p.Codigo === pais.Codigo)
  )
  
  // Ordenar alfabéticamente por descripción
  paisesUnicos.sort((a, b) => a.Descripcion.localeCompare(b.Descripcion))
  
  return {
    data: paisesUnicos,
    isLoading,
    error
  }
}
