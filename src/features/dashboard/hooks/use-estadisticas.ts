import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query'
import { aParametrosApi, periodoAnterior, type Periodo } from '@/lib/periodo'
import { useAuth } from '@/context/auth-context'
import type { EstadisticasVentas } from '../models/estadisticas.model'
import { obtenerEstadisticas } from '../services/estadisticas.service'

interface OpcionesEstadisticas {
  periodo: Periodo
  empresaId?: string
}

/**
 * Opciones de una consulta de estadísticas, ya resueltas a parámetros de API.
 *
 * La clave de caché se arma con los mismos valores que viajan en la URL de la
 * petición. Si la clave no incluyera las fechas, React Query devolvería las
 * estadísticas del período anterior al cambiar el rango.
 */
function armarConsulta(
  { periodo, empresaId }: OpcionesEstadisticas,
  token: string | null
) {
  const { fechaDesde, fechaHasta } = aParametrosApi(periodo)

  return {
    queryKey: [
      'estadisticas-ventas',
      { fechaDesde, fechaHasta, empresaId },
      token,
    ] as const,
    queryFn: () => obtenerEstadisticas({ fechaDesde, fechaHasta, empresaId }),
    enabled: !!token,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  }
}

/**
 * Estadísticas del período.
 *
 * `placeholderData: keepPreviousData` está puesto a propósito: al mover el
 * rango de fechas los gráficos mantienen su render anterior en vez de
 * desmontarse. Un esqueleto que parpadea en cada cambio de filtro salta la
 * página entera y hace perder el hilo de lo que se estaba mirando.
 */
export function useEstadisticas(opciones: OpcionesEstadisticas) {
  const { accessToken } = useAuth()
  return useQuery(armarConsulta(opciones, accessToken))
}

export interface Comparativo {
  actual?: EstadisticasVentas
  anterior?: EstadisticasVentas
  cargando: boolean
  /** `true` mientras se refresca con datos previos ya en pantalla. */
  refrescando: boolean
  error: Error | null
}

/**
 * Estadísticas del período actual y del inmediatamente anterior.
 *
 * Se piden las dos porque el `comparacion` que devuelve el backend sólo cubre
 * cantidad de ventas y monto total, y devuelve `0` cuando el período anterior
 * no tuvo ventas — indistinguible de "no varió". Con las dos respuestas
 * completas el panel puede comparar cualquier métrica y decir "sin base de
 * comparación" cuando corresponde, en vez de mentir con un 0%.
 *
 * Además habilita superponer la serie temporal anterior en el gráfico de
 * tendencia, que es la lectura que la gente realmente quiere.
 */
export function useComparativo(opciones: OpcionesEstadisticas): Comparativo {
  const { accessToken } = useAuth()
  const { periodo, empresaId } = opciones

  const anterior: OpcionesEstadisticas = {
    periodo: periodoAnterior(periodo),
    empresaId,
  }

  const resultados = useQueries({
    queries: [opciones, anterior].map((opts) =>
      armarConsulta(opts, accessToken)
    ),
  })

  const [consultaActual, consultaAnterior] = resultados

  return {
    actual: consultaActual?.data,
    anterior: consultaAnterior?.data,
    cargando: resultados.some((r) => r.isPending),
    refrescando: resultados.some((r) => r.isFetching && !r.isPending),
    error:
      (consultaActual?.error as Error | null) ??
      (consultaAnterior?.error as Error | null) ??
      null,
  }
}
