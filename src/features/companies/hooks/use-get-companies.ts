import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  getCompanies,
  type GetCompaniesParams,
} from '../services/company.service'
import { useAuth } from '@/context/auth-context'

/**
 * Listado de empresas con paginación, búsqueda y filtros resueltos por el
 * servidor. Todos los parámetros forman parte del `queryKey`: si no, React
 * Query devolvería la página cacheada sin filtrar.
 *
 * El token no se pasa al service (lo adjunta `apiFetch` desde localStorage),
 * pero sí se usa acá para habilitar la query y para invalidar la caché cuando
 * cambia la sesión.
 */
export function useGetCompanies(params: GetCompaniesParams = {}) {
  const { accessToken } = useAuth()
  const { page = 1, limit = 10, nombre, activo, sortBy, sortOrder } = params

  return useQuery({
    queryKey: [
      'companies',
      { page, limit, nombre, activo, sortBy, sortOrder },
      accessToken,
    ],
    queryFn: () =>
      getCompanies({ page, limit, nombre, activo, sortBy, sortOrder }),
    enabled: !!accessToken,
    // Evita que la tabla parpadee mientras se escribe en el buscador.
    placeholderData: keepPreviousData,
  })
}
