import type { PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/por-agencia`.
 *
 * Mirrors `InformePorAgenciaDto`. This is the report the money moves on: each
 * row is one transfer to make, and `saldoAPagar` is the amount to send.
 *
 * The panel used to compute this figure itself out of the generic statistics
 * endpoint, which is why the "saldo" it showed was a panel-side subtraction and
 * not the number the backend derives from the same data it settles with.
 */
export interface SaldoAgencia {
  /** `null` for sales whose company was never registered. */
  agenciaId: string | null
  empresaNombre: string
  /**
   * Commission configured for the company **today**, not the one applied to
   * each sale — those carry their own snapshot. A row whose
   * `comisionDescontada` does not match this percentage is not an error: it is
   * a rate that changed mid-period.
   */
  porcentajeComisionVigente: number | null
  ventasLiquidables: number
  boletosVigentes: number
  pasajes: number
  /** Discounted from the transfer. Never charged to the company or customer. */
  comisionDescontada: number
  /** `pasajes - comisionDescontada`. */
  netoATransferir: number
  /** Our income. Reported per company for traceability, not part of the saldo. */
  cargoServicioCobrado: number
  devolucionesPasajes: number
  devolucionesComision: number
  /** `netoATransferir - devolucionesPasajes + devolucionesComision`. */
  saldoAPagar: number
  /** Sales collected with no ticket issued: money taken, nothing delivered. */
  pagadasSinBoletoCantidad: number
  pagadasSinBoletoMonto: number
  /** Share of the whole period's fares, not of the page returned. */
  participacion: number
}

/**
 * Totals over every company in the period — not over the page on screen.
 *
 * Note what is missing: the API totals five lines and refunds is not one of
 * them, so the refunds column has no period total to show.
 */
export interface TotalesPorAgencia {
  pasajes: number
  comisionDescontada: number
  netoATransferir: number
  cargoServicioCobrado: number
  saldoAPagar: number
  pagadasSinBoletoMonto: number
}

export interface InformePorAgencia {
  periodo: PeriodoInforme
  data: SaldoAgencia[]
  /** Companies in the period, across every page. */
  total: number
  page: number
  limit: number
  totalPages: number
  totales: TotalesPorAgencia
}
