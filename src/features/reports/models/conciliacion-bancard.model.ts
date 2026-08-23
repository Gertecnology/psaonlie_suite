import type { PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/conciliacion-bancard`.
 *
 * Two sources counted independently — what the gateway approved and what the
 * system recorded as collected — and the difference between them. A period that
 * does not reconcile means money moved somewhere the records do not explain,
 * and that is the whole point of the report.
 */
export type TipoDescuadre =
  | 'VENTA_PAGADA_SIN_TRANSACCION'
  | 'TRANSACCION_APROBADA_SIN_VENTA_PAGADA'
  | 'MONTO_DISTINTO'

export interface DescuadreBancard {
  tipo: TipoDescuadre
  ventaId: string | null
  numeroTransaccion: string | null
  bancardTransactionId: string | null
  montoEsperado: number
  montoBancard: number
  diferencia: number
  fechaVenta: string | null
}

export interface ConciliacionBancard {
  periodo: PeriodoInforme
  /** What the gateway approved in the period. */
  bancard: {
    transaccionesAprobadas: number
    montoAprobado: number
  }
  /** What we recorded as collected: fare plus service charge, card sales. */
  registrado: {
    ventasPagadas: number
    montoEsperado: number
  }
  diferencia: number
  concilia: boolean
  descuadres: DescuadreBancard[]
  totalDescuadres: number
  page: number
  limit: number
  totalPages: number
}

/**
 * What each kind of mismatch means, in the terms of the business rather than
 * the database.
 *
 * The enum name says what the data looks like; this says what happened and who
 * it affects — which is what someone chasing a difference actually needs.
 */
export const EXPLICACION_DESCUADRE: Record<
  TipoDescuadre,
  { titulo: string; significado: string }
> = {
  VENTA_PAGADA_SIN_TRANSACCION: {
    titulo: 'Venta cobrada sin transacción',
    significado:
      'El sistema la dio por pagada pero Bancard no tiene una transacción aprobada. O el cobro no ocurrió, o se registró a mano.',
  },
  TRANSACCION_APROBADA_SIN_VENTA_PAGADA: {
    titulo: 'Cobro sin venta registrada',
    significado:
      'Bancard aprobó el pago y al cliente se le debitó, pero la venta no quedó como pagada. Es el caso que deja a alguien pagando sin pasaje.',
  },
  MONTO_DISTINTO: {
    titulo: 'Monto distinto',
    significado:
      'La venta y la transacción existen las dos, pero por importes que no coinciden.',
  },
}
