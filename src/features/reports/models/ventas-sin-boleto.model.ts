import type { PeriodoInforme } from './informe.model'

/**
 * `GET /api/admin/informes/ventas-pagadas-sin-boleto`.
 *
 * Mirrors `VentaPagadaSinBoletoDto` / `InformeVentasPagadasSinBoletoDto`.
 *
 * Every row is money already taken from a customer who never received a ticket.
 * That is why the payload carries contact details at all: the report is not
 * read to know how much was lost, it is read to call the person back.
 *
 * The browser route is `ventas-sin-boleto` and the API path is
 * `ventas-pagadas-sin-boleto` — the catalogue keeps both, see
 * `DefinicionInforme.endpoint`.
 */
export interface VentaPagadaSinBoleto {
  ventaId: string
  numeroTransaccion: string
  empresaNombre: string
  fechaVenta: string
  fechaViaje: string
  metodoPago: string
  estadoVenta: string
  pasaje: number
  cargoServicio: number
  /** `pasaje + cargoServicio`. What the customer paid and did not receive. */
  cobradoAlCliente: number
  /**
   * Hours since the sale. It is the field that separates a gateway callback
   * still in flight from a case somebody has to work by hand.
   */
  antiguedadHoras: number
  /** For chasing the payment with the gateway. `null` outside Bancard. */
  bancardTransactionId: string | null
  contactoEmail: string | null
  contactoTelefono: string | null
}

export interface InformeVentasSinBoleto {
  periodo: PeriodoInforme
  data: VentaPagadaSinBoleto[]
  /** Sales in the period, across every page. */
  total: number
  /** Collected and not delivered across the whole period, not this page. */
  montoTotal: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Age past which a sale stops being a race with the payment gateway.
 *
 * A ticket is issued within seconds of the callback landing. Anything still
 * undelivered a full day later is not a callback in flight — it is a customer
 * waiting, and the reason this report exists.
 */
export const HORAS_PARA_ANTIGUA = 24
