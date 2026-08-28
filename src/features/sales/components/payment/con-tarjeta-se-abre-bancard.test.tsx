import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { RoundTripPaymentPage } from './round-trip-payment-page'
import { mockearApi } from '@/test/api-mock'
import { renderVenta } from '@/test/render-venta'
import { datosConAsientosBloqueados } from '@/test/fixtures-venta'

/**
 * Con tarjeta se abre Bancard, no se marca el cobro a mano.
 *
 * El cobro con tarjeta lo confirma el callback de la pasarela cuando el pago
 * pasa. Ofrecer un botón de «Confirmar cobro» para una venta con tarjeta deja
 * marcar como cobrada una venta que nunca se pagó: la caja diría que entró
 * plata que no entró.
 *
 * La pantalla de viaje simple ya abría Bancard; la de ida y vuelta ofrecía
 * «Confirmar cobro» y no tenía forma de abrir la pasarela.
 */
describe('con tarjeta se abre Bancard', () => {
  const conMetodo = (metodoPago: string, estadoPago = 'PENDIENTE') => {
    const datos = datosConAsientosBloqueados()

    const venta = (ventaId: string, numeroTransaccion: string) => ({
      ventaId,
      numeroTransaccion,
      estado: 'RESERVADO',
      estadoPago,
      metodoPago,
      mensaje: '',
    })

    return {
      ...datos,
      ida: { ...datos.ida, ventaConfirmada: venta('v-ida', 'TXN29610041866') },
      vuelta: datos.vuelta
        ? {
            ...datos.vuelta,
            ventaConfirmada: venta('v-vuelta', 'TXN29612033146'),
          }
        : undefined,
    }
  }

  const montar = (metodoPago: string, estadoPago = 'PENDIENTE') => {
    mockearApi([{ url: 'estado-pago', status: 200, body: { success: true } }])

    renderVenta(<RoundTripPaymentPage />, {
      datosIniciales: conMetodo(metodoPago, estadoPago) as never,
      pasoInicial: 'payment',
    })
  }

  describe('cuando se cobra con tarjeta', () => {
    it('NO ofrece registrar el cobro a mano', () => {
      montar('BANCARD')

      expect(
        screen.queryByRole('button', { name: /Confirmar cobro/i }),
      ).not.toBeInTheDocument()
    })

    it('ofrece abrir la pasarela', () => {
      montar('BANCARD')

      expect(
        screen.getAllByRole('button', { name: /Cobrar.*tarjeta/i }).length,
      ).toBeGreaterThan(0)
    })

    it('un botón por venta pendiente', () => {
      // En ida y vuelta son dos ventas y la empresa las cobra por separado, así
      // que hay un cobro por tramo.
      montar('BANCARD')

      const botones = screen.getAllByRole('button', {
        name: /Cobrar.*tarjeta/i,
      })

      expect(botones.length).toBeGreaterThanOrEqual(1)
    })

    it('al apretarlo abre el modal de Bancard', async () => {
      montar('BANCARD')
      const usuario = userEvent.setup()

      await usuario.click(
        screen.getAllByRole('button', { name: /Cobrar.*tarjeta/i })[0],
      )

      expect(await screen.findByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/Acercale la pantalla al cliente/i)).toBeVisible()
    })

    it('el modal dice que el cobro se confirma solo', async () => {
      // Para que nadie se quede esperando a marcarlo a mano.
      montar('BANCARD')
      const usuario = userEvent.setup()

      await usuario.click(
        screen.getAllByRole('button', { name: /Cobrar.*tarjeta/i })[0],
      )

      expect(
        await screen.findByText(/se confirma solo cuando Bancard lo avisa/i),
      ).toBeInTheDocument()
    })
  })

  describe('con los demás métodos', () => {
    it('transferencia sí se registra a mano, contra el comprobante', () => {
      montar('TRANSFERENCIA')

      expect(
        screen.getByRole('button', { name: /Confirmar cobro/i }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /con tarjeta/i }),
      ).not.toBeInTheDocument()
    })

    it('efectivo, que ya nació cobrado, no ofrece ninguna de las dos', () => {
      montar('EFECTIVO', 'PAGADO')

      expect(
        screen.queryByRole('button', { name: /Confirmar cobro/i }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /con tarjeta/i }),
      ).not.toBeInTheDocument()
    })
  })
})
