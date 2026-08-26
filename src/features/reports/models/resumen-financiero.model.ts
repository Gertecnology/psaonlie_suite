import type { PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/resumen-financiero`.
 *
 * Mirrors the backend DTO. The three figures it is built on are the business
 * rule itself: the customer pays fare **plus** service charge, the company is
 * owed the fare **minus** commission, and our income is commission plus service
 * charge.
 */
export interface CobradoAlCliente {
  /** Fares, without the service charge. */
  pasajes: number
  /** Service charge — ours, billed on top of the fare. */
  cargoServicio: number
  /** What is actually debited from the customer. */
  total: number
}

export interface LiquidacionAgencias {
  pasajes: number
  /**
   * Discounted from the transfer to the company. It is never added to the
   * customer, and never becomes a receivable against the company.
   */
  comisionDescontada: number
  netoATransferir: number
}

export interface IngresoPropio {
  comision: number
  cargoServicio: number
  total: number
}

export interface Devoluciones {
  ventasReembolsadas: number
  /** Tickets voided in sales that are not refunded — a partial return. */
  boletosAnulados: number
  pasajes: number
  cargoServicio: number
  comision: number
  totalDevueltoAlCliente: number
}

export interface NetoDelPeriodo {
  cobradoAlCliente: number
  netoATransferirEmpresas: number
  ingresoPropio: number
}

export interface Volumen {
  ventasLiquidables: number
  boletosVigentes: number
  ticketPromedio: number
  boletosPorVenta: number
}

export interface BucketExcluido {
  clasificacion: string
  cantidad: number
  pasajes: number
  cargoServicio: number
  comision: number
  /** Needs looking at, as opposed to a normal exclusion like an expired hold. */
  critico: boolean
}

export interface Cuadre {
  /**
   * Sum of the absolute differences between `cobrado - devuelto` and `neto`,
   * line by line. Each side is aggregated separately in SQL, so anything other
   * than zero means the report's own figures disagree with each other — and
   * none of them should be trusted until that is explained.
   */
  descuadre: number
  cuadra: boolean
}

export interface ResumenFinanciero {
  periodo: PeriodoInforme
  cobrado: CobradoAlCliente
  agencias: LiquidacionAgencias
  propio: IngresoPropio
  devoluciones: Devoluciones
  neto: NetoDelPeriodo
  volumen: Volumen
  /** Sales left out of the figures above, and why. */
  excluido: BucketExcluido[]
  cuadre: Cuadre
}
