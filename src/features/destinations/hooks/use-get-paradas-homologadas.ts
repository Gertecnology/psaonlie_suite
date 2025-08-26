import { useQuery } from '@tanstack/react-query'
import { getAllParadasHomologadas } from '../services/destination.service'

export function useGetParadasHomologadas(descripcion?: string) {
  return useQuery({
    queryKey: ['paradas-homologadas', descripcion],
    queryFn: () => getAllParadasHomologadas(descripcion),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  })
}
