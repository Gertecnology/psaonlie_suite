import { useQuery } from '@tanstack/react-query'
import { getDestinationById } from '../services/destination.service'

export function useGetDestinationForEdit(id: string, enabled: boolean = false) {
  return useQuery({
    queryKey: ['destination-for-edit', id],
    queryFn: () => getDestinationById(id),
    enabled: enabled && !!id,
    staleTime: 0, // Siempre obtener datos frescos para edición
    gcTime: 5 * 60 * 1000, // 5 minutos
  })
}
