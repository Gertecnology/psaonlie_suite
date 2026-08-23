import type { PeriodoInforme } from './informe.model'
import type { ResumenFinanciero } from './resumen-financiero.model'

/**
 * `GET /api/admin/informes/comparativo`.
 *
 * Two full periods side by side. Both come back as complete
 * `ResumenFinancieroDto`s rather than as a handful of deltas, so anything that
 * can be read in the financial summary can be compared here too.
 */
export interface Variacion {
  actual: number
  anterior: number
  diferencia: number
  /**
   * Percentage change, `null` when the previous period was zero.
   *
   * Growth against nothing is undefined, and reporting it as 0% makes "did not
   * grow" indistinguishable from "there was nothing to compare against" — which
   * are very different things to whoever reads the report.
   */
  variacion: number | null
}

export interface Comparativo {
  periodoActual: PeriodoInforme
  periodoAnterior: PeriodoInforme
  actual: ResumenFinanciero
  anterior: ResumenFinanciero
  variaciones: Record<string, Variacion>
}

/**
 * The figures worth comparing, in reading order, with the label the reader
 * should see instead of the key the API uses.
 *
 * A fixed list and not `Object.entries(variaciones)`: the API may add keys, and
 * a report that grows rows on its own stops being the same document from one
 * month to the next.
 */
export const FILAS_COMPARATIVO: ReadonlyArray<{
  clave: string
  etiqueta: string
  /** `false` for counts, which are not money. */
  esMonto: boolean
}> = [
  { clave: 'cobradoAlCliente', etiqueta: 'Cobrado al cliente', esMonto: true },
  { clave: 'netoATransferirEmpresas', etiqueta: 'A transferir a las empresas', esMonto: true },
  { clave: 'ingresoPropio', etiqueta: 'Ingreso propio', esMonto: true },
  { clave: 'comision', etiqueta: 'Comisiones', esMonto: true },
  { clave: 'cargoServicio', etiqueta: 'Cargo por servicio', esMonto: true },
  { clave: 'ventasLiquidables', etiqueta: 'Ventas liquidables', esMonto: false },
  { clave: 'boletosVigentes', etiqueta: 'Boletos vigentes', esMonto: false },
  { clave: 'ticketPromedio', etiqueta: 'Ticket promedio', esMonto: true },
]
