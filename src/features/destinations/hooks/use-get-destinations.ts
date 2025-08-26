import { useQuery } from '@tanstack/react-query'
import { getDestinations } from '../services/destination.service'

export function useGetDestinations(params?: Record<string, string>) {
  return useQuery({
    queryKey: ['destinations', params],
    queryFn: () => getDestinations(params),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  })
}
