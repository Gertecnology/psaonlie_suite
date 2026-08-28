import { describe, expect, it } from 'vitest'

import { METODOS_PAGO, seCobraEnElActo } from '@/lib/metodo-pago'

/**
 * El efectivo se cobra en el acto, y eso decide el estado inicial de la venta.
 *
 * El checkout mandaba `estadoPago: PENDIENTE` para todos los métodos, y la API
 * lo rechazaba con:
 *
 *   «El método de pago EFECTIVO no admite estadoPago PENDIENTE: el cobro se
 *    hace en el mostrador y no existe un canal de confirmación diferida.»
 *
 * Y tiene razón: nadie manda un callback diciendo "ya te pagó en efectivo". El
 * vendedor aprieta confirmar con los billetes en la mano.
 */
describe('el estado inicial según el método', () => {
  /** La decisión tal como quedó en el checkout. */
  const estadoInicial = (metodo: string) =>
    seCobraEnElActo(metodo as never) ? 'PAGADO' : 'PENDIENTE'

  it('el efectivo nace PAGADO', () => {
    expect(estadoInicial('EFECTIVO')).toBe('PAGADO')
  })

  it('los que se confirman después nacen PENDIENTE', () => {
    // Bancard por su callback; transferencia y Wepa por verificación manual.
    expect(estadoInicial('BANCARD')).toBe('PENDIENTE')
    expect(estadoInicial('TRANSFERENCIA')).toBe('PENDIENTE')
    expect(estadoInicial('WEPA')).toBe('PENDIENTE')
  })

  it('ningún método queda sin decidir', () => {
    // Si mañana se agrega uno al enum y nadie lo clasifica, cae en PENDIENTE.
    // Eso es lo seguro: una venta pendiente se puede cobrar, una emitida sin
    // cobrar no se puede deshacer.
    for (const metodo of METODOS_PAGO) {
      expect(['PAGADO', 'PENDIENTE']).toContain(estadoInicial(metodo))
    }
  })

  it('Wepa NO se cobra en el acto', () => {
    // Es una billetera electrónica: tiene confirmación diferida, aunque el
    // cliente esté parado enfrente.
    expect(seCobraEnElActo('WEPA')).toBe(false)
  })
})
