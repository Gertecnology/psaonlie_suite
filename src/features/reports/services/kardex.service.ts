import { apiFetch } from '@/utils/api-client'
import type { FiltrosKardex } from '../models/kardex.model'

/**
 * Client for `/api/admin/kardex`.
 *
 * Read only. The ledger is written by the sales flow and the backfill; there is
 * no create endpoint here and there should not be.
 */

const BASE = '/api/admin/kardex'

function construirQuery(filtros: FiltrosKardex): URLSearchParams {
  const query = new URLSearchParams()

  const mapa: Array<[string, unknown]> = [
    ['fechaDesde', filtros.desde],
    ['fechaHasta', filtros.hasta],
    ['agenciaId', filtros.agenciaId],
    // Sólo viaja cuando es verdadero: mandar `acumulado=false` es un parámetro
    // más que decir nada, y la API rechaza lo que no declara.
    ['acumulado', filtros.acumulado ? 'true' : undefined],
    ['page', filtros.pagina],
    ['limit', filtros.tamano],
  ]

  for (const [clave, valor] of mapa) {
    if (valor === undefined || valor === null || valor === '') continue
    query.append(clave, String(valor))
  }

  return query
}

export function obtenerSaldos<T>(filtros: FiltrosKardex): Promise<T> {
  return apiFetch<T>(`${BASE}/saldos?${construirQuery(filtros).toString()}`, {
    fallbackMessage: 'No se pudieron obtener los saldos del kardex.',
  })
}

export function obtenerMovimientosAgencia<T>(
  agenciaId: string,
  filtros: FiltrosKardex,
): Promise<T> {
  return apiFetch<T>(
    `${BASE}/agencias/${agenciaId}/movimientos?${construirQuery(filtros).toString()}`,
    { fallbackMessage: 'No se pudieron obtener los movimientos.' },
  )
}

export function obtenerAnomaliasKardex<T>(filtros: FiltrosKardex): Promise<T> {
  return apiFetch<T>(`${BASE}/anomalias?${construirQuery(filtros).toString()}`, {
    fallbackMessage: 'No se pudieron obtener las anomalías del kardex.',
  })
}
