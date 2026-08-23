import { ETIQUETAS_METODO_PAGO, type MetodoPago } from '@/lib/metodo-pago'
import type { PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/por-metodo-pago`.
 *
 * Mirrors `InformePorMetodoPagoDto`. It is not paginated: the API returns every
 * method of the period in one response, so the figures on screen are the whole
 * set and not a page of it.
 */
export interface FilaMetodoPago {
  /**
   * Typed as `string` and not as `MetodoPago` because the endpoint emits
   * `'SIN_METODO'` for sales that never recorded one — a real case the union
   * does not cover, and one worth seeing rather than hiding behind a cast.
   */
  metodoPago: string
  ventasLiquidables: number
  pasajes: number
  cargoServicio: number
  comision: number
  /** `pasajes + cargoServicio`. What is actually debited from the customer. */
  cobradoAlCliente: number
  /** `comision + cargoServicio`. Ours, never attributed to the company. */
  ingresoPropio: number
  /** Sales started with this method, in any state. */
  ventasTotales: number
  /** `ventasLiquidables / ventasTotales`, in percent. */
  tasaConcrecion: number
  /** Share of what the period collected, in percent. */
  participacion: number
  pagadasSinBoletoCantidad: number
}

export interface InformePorMetodoPago {
  periodo: PeriodoInforme
  data: FilaMetodoPago[]
}

/** `'BANCARD'` → `"Bancard"`, `'SIN_METODO'` → `"Sin método registrado"`. */
export function etiquetaMetodoPago(metodo: string): string {
  if (metodo === 'SIN_METODO') return 'Sin método registrado'
  return ETIQUETAS_METODO_PAGO[metodo as MetodoPago] ?? metodo
}
