import { z } from 'zod'

/**
 * `/api/admin/kardex` — read only, and deliberately so.
 *
 * The ledger is append-only: entries are written by the sales flow and the
 * backfill, never from here. There is no endpoint to create one and there
 * should not be — a book you can edit from a screen is not evidence of
 * anything.
 *
 * Phase 1 caveat, straight from the controller: the ledger writes but nothing
 * reads it yet, so entries can be missing. These screens exist to *verify*, not
 * to replace the reports. What they show is recovered with
 * `npm run backfill:kardex`.
 */

/** Query params the kardex endpoints accept. */
export const esquemaFiltrosKardex = z.object({
  desde: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
    .optional(),
  hasta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
    .optional(),
  agenciaId: z.string().uuid().optional(),
  /**
   * Ignores the period and gives the balance since the beginning.
   *
   * It answers a different question: "what do we owe this company today",
   * versus "what did this month move". Mixing them up is how a transfer gets
   * made for the wrong amount.
   */
  acumulado: z.coerce.boolean().optional(),
  pagina: z.coerce.number().int().min(1).optional(),
  tamano: z.coerce.number().int().min(1).max(200).optional(),
  generado: z.coerce.boolean().optional(),
})

export type FiltrosKardex = z.infer<typeof esquemaFiltrosKardex>

export interface PeriodoKardex {
  desde: string
  hasta: string
}

export interface SaldoAgencia {
  agenciaId: string
  nombre: string
  codigo: string | null
  padreId: string | null
  /**
   * Sum of the account's movements, signed. **Negative means we owe them.**
   * There is no stored total: it is the movements added up.
   */
  saldo: number
  /** The same figure with the sign flipped: what to transfer. */
  netoAPagar: number
  pasajes: number
  /** Commission withheld in the period. Reduces the transfer; never a debt. */
  comision: number
  liquidado: number
  movimientos: number
}

export interface SaldoCuentaPropia {
  codigo: string
  nombre: string
  tipo: string
  saldo: number
}

export interface Saldos {
  periodo: PeriodoKardex | null
  agencias: SaldoAgencia[]
  propias: SaldoCuentaPropia[]
  totalAPagarAgencias: number
  /**
   * Sum of **every** movement in the period. A ledger that balances gives 0.
   * Anything else is a broken entry, and every figure above is suspect until
   * it is explained.
   */
  descuadre: number
}

export interface MovimientoAgencia {
  movimientoId: string
  asientoId: string
  fechaHecho: string
  tipoAsiento: string
  concepto: string
  monto: number
  ventaId: string | null
  numeroTransaccion: string | null
  descripcion: string
}

export interface MovimientosAgencia {
  agenciaId: string
  periodo: PeriodoKardex
  movimientos: MovimientoAgencia[]
  total: number
  page: number
  limit: number
  saldoDelPeriodo: number
}

export interface AnomaliaKardex {
  ventaId: string
  numeroTransaccion: string
  fechaVenta: string
  metodoPago: string
  agenciaId: string
  agenciaNombre: string | null
  motivo: string
  monto: number
}

export interface AnomaliasKardex {
  periodo: PeriodoKardex
  anomalias: AnomaliaKardex[]
  sinAsientoDeVenta: number
  sinAsientoDeCobro: number
  /** Money taken from customers that the ledger has in no cash account. */
  montoSinImputar: number
}

/** True once the user asked for it. Same gate the reports use. */
export function kardexGenerado(filtros: FiltrosKardex): boolean {
  // `acumulado` ignora el período, así que no necesita fechas para ser válido.
  if (filtros.acumulado) return Boolean(filtros.generado)
  return Boolean(filtros.generado && filtros.desde && filtros.hasta)
}
