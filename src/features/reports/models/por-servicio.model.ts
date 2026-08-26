import type { PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/por-servicio`.
 *
 * Mirrors `FilaServicioDto` / `InformePorServicioDto`.
 *
 * Note what the API does **not** send: a service name. There is `servicioId`,
 * the company and the quality tier, and nothing else — so the screen shows the
 * id rather than inventing a label out of the other two, which would collapse
 * every "Canindeyú / Ejecutivo" service into one indistinguishable row.
 *
 * Paginated in the database, and with no totals object: the rows on screen are
 * one page of the period, so nothing here may be summed and presented as the
 * period's total.
 */
export interface FilaServicio {
  /** The only stable identity a row has. There is no name in the payload. */
  servicioId: string
  empresaNombre: string
  /** Quality tier, e.g. `'EJECUTIVO'`. `null` when the service declares none. */
  calidad: string | null
  ventasLiquidables: number
  boletosVigentes: number
  pasajes: number
  cargoServicio: number
  comision: number
  /** `comision + cargoServicio`. Ours, never attributed to the company. */
  ingresoPropio: number
  /**
   * First and last **trip date** sold for this service inside the period — not
   * the sale dates. A service whose last trip already passed sold nothing for
   * the days ahead, and that is only visible here.
   */
  primerViaje: string | null
  ultimoViaje: string | null
}

export interface InformePorServicio {
  periodo: PeriodoInforme
  data: FilaServicio[]
  /** Services in the period, across every page. */
  total: number
  page: number
  limit: number
  totalPages: number
}
