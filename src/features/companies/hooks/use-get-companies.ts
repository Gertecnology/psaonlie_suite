import { useQuery } from '@tanstack/react-query'
import { getCompanies } from '../services/company.service'
import { useAuth } from '@/context/auth-context'

export function useGetCompanies(page: number, limit: number) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['companies', page, limit, accessToken],
    queryFn: () => {
      if (!accessToken) throw new Error('No hay token de acceso')
      return getCompanies(accessToken, page, limit)
    },
    enabled: !!accessToken,
  })
} 