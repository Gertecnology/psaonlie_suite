import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/auth-context'
import { obtenerEmpresas } from '../services/empresas-panel.service'

/**
 * Empresas para el selector del panel.
 *
 * Cambian poco: se cachean 10 minutos. Comparte `queryKey` con la alerta de
 * conectividad sólo en el service, no en la caché, porque esta consulta se
 * refresca mucho menos seguido.
 */
export function useEmpresasPanel() {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['empresas-panel', accessToken],
    queryFn: () => obtenerEmpresas(),
    enabled: !!accessToken,
    staleTime: 10 * 60 * 1000,
  })
}
