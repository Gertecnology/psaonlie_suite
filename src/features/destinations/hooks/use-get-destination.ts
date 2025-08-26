import { useQuery } from '@tanstack/react-query'
import { getDestinationById } from '../services/destination.service'

export function useGetDestination(id: string) {
  return useQuery({
    queryKey: ['destination', id],
    queryFn: () => getDestinationById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}
