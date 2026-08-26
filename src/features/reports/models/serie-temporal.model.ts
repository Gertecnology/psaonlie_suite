import type { FiltrosInforme, PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/serie-temporal`.
 *
 * Mirrors `PuntoSerieTemporalDto` / `SerieTemporalDto`. One point per bucket,
 * and the bucket size is whatever `agruparPor` asked for.
 *
 * It is **not** paginated: `data` is every bucket of the period, so the sum of
 * the rows on screen really is the period's total and a footer may state it.
 */
export interface PuntoSerieTemporal {
  /**
   * Start of the bucket, `YYYY-MM-DD`. For `semana` and `mes` it is the first
   * day of the bucket, not a range — which is why the column says so in words:
   * "2026-08-03" under a weekly grouping means the week that starts there.
   */
  periodo: string
  /** Sales started inside the bucket, in any state. */
  ventasTotales: number
  /** Sales that ended up collected and with tickets issued. */
  ventasLiquidables: number
  /** Collected with no ticket issued: money taken, nothing delivered. */
  pagadasSinBoleto: number
  pasajes: number
  cargoServicio: number
  comision: number
  /** `pasajes + cargoServicio`. What is debited from the customer. */
  cobradoAlCliente: number
  netoATransferirEmpresas: number
  /** `comision + cargoServicio`. Ours, never attributed to the company. */
  ingresoPropio: number
}

/** How the period is cut up. The API defaults to `dia`. */
export type AgrupacionSerie = NonNullable<FiltrosInforme['agruparPor']>

export interface SerieTemporal {
  periodo: PeriodoInforme
  /**
   * Typed as `string` and not as the union: it is what the server actually
   * applied, and a value the panel does not know about is worth showing raw
   * rather than hiding behind a cast.
   */
  agruparPor: string
  data: PuntoSerieTemporal[]
}

const ETIQUETAS_AGRUPACION: Record<string, string> = {
  dia: 'Día',
  semana: 'Semana',
  mes: 'Mes',
}

/** `'semana'` → `"Semana"`. Falls back to the raw value it does not know. */
export function etiquetaAgrupacion(agruparPor: string): string {
  return ETIQUETAS_AGRUPACION[agruparPor] ?? agruparPor
}
