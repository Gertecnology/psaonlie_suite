import { useQueries } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useAuth } from '@/context/auth-context'
import { apiFetch } from '@/utils/api-client'
import { type Agencia } from '../models/agencia.model'

/**
 * `GET /agencias/:id/hijas` — las agencias de una empresa, completas.
 *
 * El listado paginado ya embebe las hijas, pero con un DTO reducido que no trae
 * `heredaComision` ni el `porcentajeVentas` propio. Sin esos dos no se puede
 * decir qué comisión cobra cada agencia, y adivinar es informar mal una plata.
 */
export async function obtenerHijas(padreId: string): Promise<Agencia[]> {
  const hijas = await apiFetch<Agencia[]>(`/agencias/${padreId}/hijas`, {
    fallbackMessage: 'Error al obtener las agencias de la empresa.',
  })
  return hijas ?? []
}

/**
 * Las agencias de cada empresa desplegada, indexadas por el id del padre.
 *
 * Se pide una consulta por empresa abierta en vez de una sola con todo: cada
 * una se cachea e invalida por separado, y desplegar una empresa no vuelve a
 * traer las que ya estaban abiertas.
 *
 * Mientras una consulta está en vuelo su empresa no aparece en el mapa, y
 * `aplanarJerarquia` cae en las hijas embebidas del listado. La jerarquía se
 * ve al instante; la comisión espera al dato bueno.
 */
export function useHijas(
  padresExpandidos: ReadonlySet<string>,
): ReadonlyMap<string, Agencia[]> {
  const { accessToken } = useAuth()

  // El orden importa: `useQueries` mapea resultados por posición, y un `Set`
  // no garantiza uno estable entre renders si se reconstruye.
  const ids = useMemo(
    () => [...padresExpandidos].sort(),
    [padresExpandidos],
  )

  // `combine` en vez de armar el mapa después: React Query lo memoiza mientras
  // los resultados no cambien, así que el mapa conserva su identidad y la tabla
  // no rearma su modelo de filas en cada render.
  const combinar = useCallback(
    (resultados: { data?: Agencia[] }[]): ReadonlyMap<string, Agencia[]> => {
      const mapa = new Map<string, Agencia[]>()
      resultados.forEach((resultado, indice) => {
        if (resultado.data) mapa.set(ids[indice], resultado.data)
      })
      return mapa
    },
    [ids],
  )

  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ['agencia-hijas', id, accessToken],
      queryFn: () => obtenerHijas(id),
      enabled: !!accessToken,
      staleTime: 5 * 60 * 1000,
    })),
    combine: combinar,
  })
}
