import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  obtenerAgencias,
  obtenerAgenciaPorId,
  type ObtenerAgenciasParams,
} from '../services/agencia.service'
import { useAuth } from '@/context/auth-context'

/**
 * Listado de agencias con paginación, búsqueda y filtros resueltos por el
 * servidor. Todos los parámetros forman parte del `queryKey`: si no, React
 * Query devolvería la página cacheada sin filtrar.
 *
 * El token no se pasa al service (lo adjunta `apiFetch` desde localStorage),
 * pero sí se usa acá para habilitar la query y para invalidar la caché cuando
 * cambia la sesión.
 */
export function useAgencias(params: ObtenerAgenciasParams = {}) {
  const { accessToken } = useAuth()
  const { page = 1, limit = 10, nombre, activo, sortBy, sortOrder } = params

  return useQuery({
    queryKey: [
      'agencias',
      { page, limit, nombre, activo, sortBy, sortOrder },
      accessToken,
    ],
    queryFn: () =>
      obtenerAgencias({ page, limit, nombre, activo, sortBy, sortOrder }),
    enabled: !!accessToken,
    // Evita que la tabla parpadee mientras se escribe en el buscador.
    placeholderData: keepPreviousData,
  })
}

/**
 * Una agencia completa por id.
 *
 * Existe para las agencias hijas: el listado las embebe con un DTO reducido
 * que no trae `heredaComision` ni su `porcentajeVentas` propio, y el formulario
 * de edición necesita los dos para no pisar la configuración de comisión con
 * un valor inventado.
 */
export function useAgencia(id: string | undefined, habilitada = true) {
  const { accessToken } = useAuth()

  return useQuery({
    queryKey: ['agencia', id, accessToken],
    queryFn: () => obtenerAgenciaPorId(id!),
    enabled: habilitada && !!id && !!accessToken,
  })
}
