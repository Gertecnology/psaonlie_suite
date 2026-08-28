import { describe, expect, it } from 'vitest'

import { METODOS_PAGO, OPCIONES_METODO_PAGO } from '@/lib/metodo-pago'

/**
 * El método de pago se elige ANTES de confirmar la venta.
 *
 * El checkout mandaba `metodoPago: 'EFECTIVO'` fijo y el paso siguiente lo
 * corregía. Dos consecuencias:
 *
 *  - Una venta que expira sin cobrarse queda registrada como efectivo para
 *    siempre, y el informe por método de pago cuenta como efectivo algo que
 *    nadie pagó nunca.
 *  - El vendedor elige el método después de haber emitido el compromiso con la
 *    transportista, cuando ya no puede volver atrás.
 *
 * Los cuatro métodos salen de `lib/metodo-pago`, que es la lista compartida
 * entre la caja y los informes. Ver `features/caja/METODOS-DE-PAGO.md`: hoy
 * hay tres listas en el sistema y ya divergen — el endpoint que las expone no
 * incluye efectivo, que es justamente el de la caja.
 */
describe('el método de pago del checkout', () => {
  it('ofrece los cuatro que la API acepta', () => {
    expect(METODOS_PAGO).toEqual([
      'BANCARD',
      'WEPA',
      'TRANSFERENCIA',
      'EFECTIVO',
    ])
  })

  it('incluye efectivo, que es el de la caja', () => {
    // El endpoint del backend que expone métodos NO lo incluye. Si la pantalla
    // lo consumiera tal como está, un vendedor no podría cobrar en efectivo.
    expect(OPCIONES_METODO_PAGO.map((opcion) => opcion.value)).toContain(
      'EFECTIVO',
    )
  })

  it('cada opción tiene una etiqueta legible', () => {
    // El operador lee "Transferencia", no "TRANSFERENCIA".
    for (const opcion of OPCIONES_METODO_PAGO) {
      expect(opcion.label).toBeTruthy()
      expect(opcion.label).not.toBe(opcion.value)
    }
  })

  it('no ofrece ninguno que la API rechace', () => {
    // La pantalla de venta simple llegó a ofrecer tarjeta de crédito, débito y
    // cheque —ninguno existía en la API— y elegir uno fallaba con un 400 que el
    // cajero no podía explicar.
    const aceptados = new Set<string>(METODOS_PAGO)

    for (const opcion of OPCIONES_METODO_PAGO) {
      expect(aceptados.has(opcion.value)).toBe(true)
    }
  })
})
