import { useQuery } from '@tanstack/react-query'
import { getServiceCharges } from '../services/service-charge.service'

interface UseGetServiceChargesParams {
  page: number
  limit: number
}

export function useGetServiceCharges({ page, limit }: UseGetServiceChargesParams) {
  return useQuery({
    queryKey: ['service-charges', { page, limit }],
    queryFn: () => getServiceCharges(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}
