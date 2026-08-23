import type { PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/estado-ventas`.
 *
 * Mirrors `EstadoVentasDto`.
 *
 * The classification exists because `estado_pago` alone cannot say whether a
 * sale went well. A `PAGADO` sale with no ticket issued is a customer who paid
 * and got nothing, and every report used to count it as a completed sale.
 */
export type ClasificacionVenta =
  | 'LIQUIDABLE'
  | 'PAGADA_SIN_BOLETO'
  | 'REEMBOLSADA'
  | 'PENDIENTE'
  | 'EXPIRADA'
  | 'NO_CONCRETADA'
  | 'OTRA'

const ETIQUETAS: Record<ClasificacionVenta, string> = {
  LIQUIDABLE: 'Liquidable',
  PAGADA_SIN_BOLETO: 'Cobrada sin boleto',
  REEMBOLSADA: 'Reembolsada',
  PENDIENTE: 'Pendiente de pago',
  EXPIRADA: 'Expirada',
  NO_CONCRETADA: 'No concretada',
  OTRA: 'Otra',
}

const DESCRIPCIONES: Record<ClasificacionVenta, string> = {
  LIQUIDABLE: 'Pagada y con los boletos emitidos. Es la única que se liquida.',
  PAGADA_SIN_BOLETO: 'El cliente pagó y no recibió su pasaje.',
  REEMBOLSADA: 'Cobrada y después devuelta al cliente.',
  PENDIENTE: 'Todavía espera el pago.',
  EXPIRADA: 'El plazo para pagarla venció.',
  NO_CONCRETADA: 'Cancelada o fallida antes de cobrarse.',
  OTRA: 'Estado no contemplado. Que aparezca es en sí un hallazgo.',
}

/**
 * The two lookups fall back to the raw value on purpose: a classification the
 * panel does not know about is exactly the case `OTRA` was invented for, and
 * printing the code the backend sent beats printing `undefined`.
 */
export function etiquetaClasificacion(clasificacion: string): string {
  return ETIQUETAS[clasificacion as ClasificacionVenta] ?? clasificacion
}

export function descripcionClasificacion(clasificacion: string): string {
  return DESCRIPCIONES[clasificacion as ClasificacionVenta] ?? ''
}

export interface BucketClasificacion {
  clasificacion: ClasificacionVenta
  cantidad: number
  pasajes: number
  cargoServicio: number
  comision: number
  /** Money at risk or already collected badly, as opposed to a normal outcome. */
  critico: boolean
  /** Share of `totalVentas`, in percent. */
  porcentaje: number
}

export interface IndicadorCritico {
  cantidad: number
  /** Amount involved, as charged to the customer. */
  monto: number
  /** Oldest sale still in this state. `null` when there is none. */
  desde: string | null
}

/**
 * The three crossings that give away that money and delivery disagree.
 *
 * They are not statuses but contradictions between tables, which is why they
 * cannot be read off `porClasificacion`.
 */
export interface IndicadoresCriticos {
  /** Paid, no ticket issued. */
  pagadasSinBoleto: IndicadorCritico & { porcentajeSobrePagadas: number }
  /** Marked as paid with no approved gateway transaction behind it. */
  pagadasSinTransaccionAprobada: IndicadorCritico
  /** Ticket issued with no payment recorded. */
  conBoletoSinPagoRegistrado: IndicadorCritico
}

export interface EstadoVentas {
  periodo: PeriodoInforme
  totalVentas: number
  porClasificacion: BucketClasificacion[]
  indicadoresCriticos: IndicadoresCriticos
}
