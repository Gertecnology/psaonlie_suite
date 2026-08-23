import type { PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/anomalias`.
 *
 * Mirrors `AnomaliaDto` / `InformeAnomaliasDto`. Each row is a sale whose own
 * figures contradict each other: a commission that does not match its snapshot,
 * an amount that is not positive, tickets with no payment recorded.
 *
 * These are not "sales to review" in the business sense — they are rows the
 * other reports are quietly counting. A commission larger than the fare adds up
 * into the saldo a company is transferred, and nothing else in the panel says
 * so.
 */
export type TipoAnomalia =
  | 'COMISION_INCONSISTENTE'
  | 'COMISION_AUSENTE'
  | 'SIN_SNAPSHOT_COMISION'
  | 'COMISION_MAYOR_QUE_PASAJE'
  | 'IMPORTE_NO_POSITIVO'
  | 'CARGO_SERVICIO_SIN_SNAPSHOT'
  | 'BOLETOS_SIN_PAGO_REGISTRADO'

export interface Anomalia {
  tipo: TipoAnomalia
  ventaId: string
  numeroTransaccion: string
  empresaNombre: string
  fechaVenta: string
  estadoPago: string
  pasaje: number
  comision: number
  /** What the commission should have been according to the sale's snapshot. */
  comisionEsperada: number
  /** The backend's own wording of what is wrong with this row. */
  detalle: string
}

export interface InformeAnomalias {
  periodo: PeriodoInforme
  data: Anomalia[]
  /** Anomalies in the period, across every page. */
  total: number
  page: number
  limit: number
  totalPages: number
  /**
   * Count per type over the **whole period**, not the page.
   *
   * Typed as an open record because that is what the API declares: a type the
   * panel has never seen is itself a finding, and dropping it would hide the
   * one anomaly nobody anticipated.
   */
  resumen: Record<string, number>
}

const ETIQUETAS_ANOMALIA: Record<string, string> = {
  COMISION_INCONSISTENTE: 'Comisión distinta de la del snapshot',
  COMISION_AUSENTE: 'Comisión ausente',
  SIN_SNAPSHOT_COMISION: 'Sin snapshot de comisión',
  COMISION_MAYOR_QUE_PASAJE: 'Comisión mayor que el pasaje',
  IMPORTE_NO_POSITIVO: 'Importe no positivo',
  CARGO_SERVICIO_SIN_SNAPSHOT: 'Cargo por servicio sin snapshot',
  BOLETOS_SIN_PAGO_REGISTRADO: 'Boletos sin pago registrado',
}

/**
 * `'COMISION_AUSENTE'` → `"Comisión ausente"`.
 *
 * Falls back to the raw value: an unknown type reaching the screen is exactly
 * the case this report is for, and it has to be readable, not swallowed.
 */
export function etiquetaAnomalia(tipo: string): string {
  return ETIQUETAS_ANOMALIA[tipo] ?? tipo
}

/**
 * Stable identity of an anomaly row.
 *
 * The sale id alone is not enough: one sale can trip several checks and come
 * back as several rows, so keying by it would give two rows the same key.
 */
export function claveAnomalia(anomalia: Anomalia): string {
  return `${anomalia.tipo}:${anomalia.ventaId}`
}
