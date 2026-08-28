import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RoundTripPaymentPage } from './round-trip-payment-page'
import { mockearApi } from '@/test/api-mock'
import { renderVenta } from '@/test/render-venta'
import { datosConAsientosBloqueados } from '@/test/fixtures-venta'

/**
 * No se cobra dos veces lo que ya se cobró.
 *
 * El método de pago se elige al vender, antes de confirmar: la venta nace con
 * ese dato. Pero el paso siguiente seguía pidiéndolo como si nunca se hubiera
 * elegido, y a una venta en efectivo —que nace `PAGADO`— le intentaba registrar
 * el cobro otra vez. El backend lo rechazaba con «Transición de estado no
 * válida: PAGADO → PAGADO», así que el vendedor veía un error rojo sobre una
 * venta que estaba perfecta.
 */
describe('no se cobra dos veces', () => {
  /** Los datos de una venta ya confirmada, con el estado que se le indique. */
  const laVenta = (estadoPago: string, metodoPago: string) => {
    const datos = datosConAsientosBloqueados()

    return {
      ...datos,
      ida: {
        ...datos.ida,
        ventaConfirmada: {
          ventaId: 'v-1',
          numeroTransaccion: 'TXN11311703245',
          estado: 'CONFIRMADO',
          estadoPago,
          metodoPago,
          mensaje: '',
        },
      },
    }
  }

  const montar = (estadoPago: string, metodoPago: string) => {
    const api = mockearApi([
      { url: 'estado-pago', status: 200, body: { success: true } },
    ])

    renderVenta(<RoundTripPaymentPage />, {
      datosIniciales: laVenta(estadoPago, metodoPago) as never,
      pasoInicial: 'payment',
    })

    return api
  }

  describe('cuando la venta nació pagada, como en efectivo', () => {
    it('NO ofrece registrar el cobro', () => {
      montar('PAGADO', 'EFECTIVO')

      expect(
        screen.queryByRole('button', { name: /Confirmar cobro/i }),
      ).not.toBeInTheDocument()
    })

    it('avisa que ya está cobrada', () => {
      montar('PAGADO', 'EFECTIVO')

      expect(screen.getByText(/Cobro registrado/i)).toBeInTheDocument()
    })

    it('no vuelve a preguntar el método', () => {
      montar('PAGADO', 'EFECTIVO')

      expect(
        screen.queryByText('Seleccionar método'),
      ).not.toBeInTheDocument()
    })

    it('muestra con qué se cobró', () => {
      montar('PAGADO', 'EFECTIVO')

      expect(screen.getByText('Efectivo')).toBeInTheDocument()
    })
  })

  describe('cuando queda por cobrar, como con transferencia', () => {
    it('deja registrar el cobro', () => {
      montar('PENDIENTE', 'TRANSFERENCIA')

      expect(
        screen.getByRole('button', { name: /Confirmar cobro/i }),
      ).toBeInTheDocument()
    })

    it('tampoco pregunta el método: ya se eligió al vender', () => {
      montar('PENDIENTE', 'TRANSFERENCIA')

      expect(screen.queryByText('Seleccionar método')).not.toBeInTheDocument()
      expect(screen.getByText('Transferencia')).toBeInTheDocument()
    })

    it('registra el cobro con el método de la venta, no con otro', async () => {
      const api = montar('PENDIENTE', 'TRANSFERENCIA')
      const usuario = userEvent.setup()

      await usuario.click(
        screen.getByRole('button', { name: /Confirmar cobro/i }),
      )

      await waitFor(() => expect(api.llamadasA('estado-pago')).toBe(1))

      const [enviado] = api.cuerposDe('estado-pago') as [
        Record<string, unknown>,
      ]

      expect(enviado.metodoPago).toBe('TRANSFERENCIA')
      expect(enviado.estadoPago).toBe('PAGADO')
    })
  })
})
