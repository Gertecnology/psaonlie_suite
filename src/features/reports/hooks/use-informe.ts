import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/auth-context'
import { estaGenerado, type FiltrosInforme } from '../models/informe.model'
import { obtenerInforme } from '../services/informes.service'

/**
 * Fetches a report — but only once the user asked for it.
 *
 * The old hooks were `enabled: !!token`, so landing on the reports page fired
 * every query with a default 30-day window. Two reports fired twice. On a real
 * data set that is a slow page nobody requested, and it hides the one question
 * that matters: which period are we looking at?
 *
 * Here `enabled` depends on `generado`, which only the Generar button sets. The
 * gate is the point, not an optimisation.
 */
export function useInforme<T>(ruta: string, filtros: FiltrosInforme) {
  const { accessToken } = useAuth()
  const generado = estaGenerado(filtros)

  return useQuery<T>({
    queryKey: ['informe', ruta, filtros, accessToken],
    queryFn: () => obtenerInforme<T>(ruta, filtros),
    enabled: Boolean(accessToken) && generado,
    // Sin `keepPreviousData` a propósito. En el panel evita el parpadeo, pero
    // acá mostraría el informe anterior mientras corre el nuevo: los números de
    // otro período con el encabezado del actual es peor que una espera.
    staleTime: 60_000,
    retry: 1,
  })
}
