import type { PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/por-ruta`.
 *
 * Mirrors `FilaRutaDto` / `InformePorRutaDto`. One row per origin-destination
 * pair, so the pair itself is the row's identity: the API returns no id for it.
 *
 * The report is paginated in the database, which is why there is no totals
 * object here and none is computed on the client: the rows on screen are one
 * page of the period, and adding them up would state a page as if it were the
 * whole. `participacion` is the only period-wide figure per row, and the API
 * calculates it.
 */
export interface FilaRuta {
  origenNombre: string
  destinoNombre: string
  ventasLiquidables: number
  boletosVigentes: number
  pasajes: number
  cargoServicio: number
  comision: number
  /** `comision + cargoServicio`. Ours, never attributed to the company. */
  ingresoPropio: number
  /**
   * `pasajes / boletosVigentes` — the average price of a seat on this route,
   * not the average sale. A sale can carry several tickets, so dividing by
   * sales would give a different and larger number.
   */
  tarifaPromedio: number
  /** Share of the whole period's fares, not of the page returned. */
  participacion: number
}

export interface InformePorRuta {
  periodo: PeriodoInforme
  data: FilaRuta[]
  /** Routes in the period, across every page. */
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Stable identity of a route row.
 *
 * The pair of stop names is what the backend groups by, so it is the real key.
 * Using the array index instead would make the key mean "whatever is third on
 * this page", which changes meaning on every page turn.
 */
export function claveRuta(fila: FilaRuta): string {
  return `${fila.origenNombre}→${fila.destinoNombre}`
}
