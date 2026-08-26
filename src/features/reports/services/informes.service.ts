import { formatearFechaISO } from '@/lib/formato'
import { apiDownload, apiFetch, descargarBlob } from '@/utils/api-client'
import type { FiltrosInforme } from '../models/informe.model'

/**
 * Client for `/api/admin/informes`.
 *
 * These eleven endpoints have existed on the backend since the reports module
 * was written, and the panel never called them: it consumed the generic
 * `/api/admin/ventas/estadisticas` and computed its own balances on top. That
 * is why the "saldo" shown per company was a panel-side calculation and not the
 * figure the backend produces from the same data it uses everywhere else.
 *
 * Every endpoint resolves its filters in the database, returns
 * `periodo{desde,hasta,dias}` — which is what the traceability header is built
 * from — and wraps its payload in `{success, statusCode, message, data}`.
 */

const BASE = '/api/admin/informes'

/**
 * The API rejects any parameter it does not declare (`forbidNonWhitelisted`),
 * so sending an empty one is a 400 rather than a no-op.
 */
function construirQuery(filtros: FiltrosInforme): URLSearchParams {
  const query = new URLSearchParams()

  const mapa: Array<[string, unknown]> = [
    ['fechaDesde', filtros.desde],
    ['fechaHasta', filtros.hasta],
    ['agenciaId', filtros.agenciaId],
    ['metodoPago', filtros.metodoPago],
    ['origenId', filtros.origenId],
    ['destinoId', filtros.destinoId],
    ['agruparPor', filtros.agruparPor],
    ['comparativoDesde', filtros.comparativoDesde],
    ['comparativoHasta', filtros.comparativoHasta],
    ['page', filtros.pagina],
    ['limit', filtros.tamano],
  ]

  for (const [clave, valor] of mapa) {
    if (valor === undefined || valor === null || valor === '') continue
    query.append(clave, String(valor))
  }

  return query
}

/**
 * `apiFetch` already unwraps the `{success, data}` envelope, checks the HTTP
 * status and attaches the token, so this is only the path and the query.
 */
export function obtenerInforme<T>(
  ruta: string,
  filtros: FiltrosInforme,
): Promise<T> {
  const query = construirQuery(filtros)
  return apiFetch<T>(`${BASE}/${ruta}?${query.toString()}`, {
    fallbackMessage: 'No se pudo generar el informe.',
  })
}

/**
 * Downloads the whole set as `.xlsx`, one sheet per report.
 *
 * The file name carries the period in ISO 8601 so that a folder of exports
 * sorts chronologically on its own.
 */
export async function exportarInformes(filtros: FiltrosInforme): Promise<void> {
  const query = construirQuery(filtros)
  const { blob, nombreArchivo } = await apiDownload(
    `${BASE}/exportar?${query.toString()}`,
    { fallbackMessage: 'No se pudo exportar el informe.' },
  )

  const periodo =
    filtros.desde && filtros.hasta
      ? `${filtros.desde}_${filtros.hasta}`
      : formatearFechaISO(new Date())

  descargarBlob(blob, nombreArchivo ?? `informes_${periodo}.xlsx`)
}
