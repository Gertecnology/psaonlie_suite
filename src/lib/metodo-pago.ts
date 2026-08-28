/**
 * Payment methods the API accepts. These four and no others.
 *
 * Each value answers one question: which cash account the money landed in.
 * A contact channel is not a payment method — a customer may reach us on
 * WhatsApp, but what they pay with is a bank transfer or cash. When WhatsApp
 * sat in this list, sales were recorded as collected with no way to tell which
 * account to reconcile them against.
 *
 * This lives in `lib/` and not inside a feature because both the cashier
 * screens and the dashboard reports need it. They used to keep separate lists
 * and drifted: the single-trip payment screen offered credit card, debit card
 * and cheque — none of which the API has ever accepted — so choosing one
 * failed with a 400 the cashier could not explain.
 */
export const METODOS_PAGO = [
  'BANCARD',
  'WEPA',
  'TRANSFERENCIA',
  'EFECTIVO',
] as const

export type MetodoPago = (typeof METODOS_PAGO)[number]

export const ETIQUETAS_METODO_PAGO: Record<MetodoPago, string> = {
  BANCARD: 'Bancard',
  WEPA: 'Wepa',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
}

/**
 * Methods an administrator confirms by hand, against a receipt. Bancard is
 * excluded: it has a gateway callback, and nobody eyeballs a card payment.
 */
export const METODOS_PAGO_MANUAL: readonly MetodoPago[] = [
  'TRANSFERENCIA',
  'WEPA',
]

/** Options for a `<Select>`, in the order the cashier reads them. */
export const OPCIONES_METODO_PAGO = METODOS_PAGO.map((metodo) => ({
  value: metodo,
  label: ETIQUETAS_METODO_PAGO[metodo],
}))

/**
 * Métodos que se cobran en el mostrador, en el mismo acto de la venta.
 *
 * La API los rechaza con `estadoPago: PENDIENTE`: no existe un canal por el
 * que confirmarlos después —nadie manda un callback diciendo "ya te pagó en
 * efectivo"— así que el estado inicial tiene que ser `PAGADO`.
 *
 * Para el vendedor eso es lo que pasa de verdad: aprieta confirmar cuando ya
 * tiene los billetes en la mano.
 */
export const METODOS_COBRADOS_EN_EL_ACTO: readonly MetodoPago[] = ['EFECTIVO']

/** Si este método se cobra en el mostrador y no admite confirmación diferida. */
export function seCobraEnElActo(metodoPago: MetodoPago | ''): boolean {
  return METODOS_COBRADOS_EN_EL_ACTO.includes(metodoPago as MetodoPago)
}
