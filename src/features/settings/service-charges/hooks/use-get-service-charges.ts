import { useQuery } from '@tanstack/react-query'
import { getServiceCharges } from '../services/service-charge.service'
import { useAuth } from '@/context/auth-context'

export function useGetServiceCharges(page: number, limit: number) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['service-charges', page, limit, accessToken],
    queryFn: () => {
      if (!accessToken) throw new Error('No hay token de acceso')
      return getServiceCharges(accessToken, page, limit)
    },
    enabled: !!accessToken,
  })
}
