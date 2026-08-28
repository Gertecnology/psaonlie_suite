import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/caja/services/caja.service', () => ({
  enviarDocumentos: vi.fn(() => Promise.resolve({ enviado: true, mensaje: '' })),
  descargarFactura: vi.fn(() => Promise.resolve()),
  // El listado de documentos vive dentro de esta tarjeta: sin estos dobles, la
  // pantalla no llega a montarse y todo lo de abajo falla por una razón que no
  // tiene que ver con entregar nada.
  obtenerFacturasDeLaVenta: vi.fn(() => Promise.resolve([])),
  verDocumento: vi.fn(),
  descargarDocumento: vi.fn(),
}))

import {
  descargarFactura,
  enviarDocumentos,
} from '@/features/caja/services/caja.service'
import { renderConProveedores } from '@/test/utils'
import { EntregarLosDocumentos } from './entregar-los-documentos'

/**
 * Entregarle al cliente lo que compró.
 *
 * Era el paso que faltaba: la venta se hacía bien y el cliente se iba sin nada.
 * Los documentos de una venta de mostrador **se generan recién cuando se
 * piden** —a diferencia de la web, que los manda sola—, así que sin este paso
 * la venta quedaba sin boleto ni factura, y nadie lo notaba hasta que el
 * pasajero llegaba a la terminal.
 */
describe('entregar los documentos', () => {
  const montar = () =>
    renderConProveedores(
      <EntregarLosDocumentos numeroTransaccion='TXN11311703245' />,
    )

  beforeEach(() => {
    vi.mocked(enviarDocumentos).mockClear()
    vi.mocked(descargarFactura).mockClear()
  })

  describe('por correo', () => {
    it('manda a la dirección que se escriba', async () => {
      montar()

      await userEvent.type(
        screen.getByLabelText(/Mandárselos por correo/i),
        'sncastro20@gmail.com',
      )
      await userEvent.click(screen.getByRole('button', { name: /^Enviar$/i }))

      await waitFor(() =>
        expect(enviarDocumentos).toHaveBeenCalledWith(
          'TXN11311703245',
          'sncastro20@gmail.com',
        ),
      )
    })

    it('sin correo, cada documento va a quien le corresponde', async () => {
      // El comprador recibe todo; cada pasajero, su boleto. Lo resuelve el
      // backend, así que acá se manda sin destinatario.
      montar()

      await userEvent.click(screen.getByRole('button', { name: /^Enviar$/i }))

      await waitFor(() =>
        expect(enviarDocumentos).toHaveBeenCalledWith(
          'TXN11311703245',
          undefined,
        ),
      )
    })

    it('después de enviar, ofrece volver a enviar', async () => {
      // En el mostrador se equivoca el correo y hay que repetirlo.
      montar()

      await userEvent.click(screen.getByRole('button', { name: /^Enviar$/i }))

      expect(
        await screen.findByRole('button', { name: /Volver a enviar/i }),
      ).toBeInTheDocument()
    })

    it('un fallo no rompe la pantalla', async () => {
      vi.mocked(enviarDocumentos).mockRejectedValueOnce(new Error('sin conexión'))

      montar()

      await userEvent.click(screen.getByRole('button', { name: /^Enviar$/i }))

      // Sigue en pie para reintentar.
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /^Enviar$/i })).toBeEnabled(),
      )
    })
  })

  describe('imprimiendo', () => {
    it('en hoja', async () => {
      montar()

      await userEvent.click(screen.getByRole('button', { name: /En hoja/i }))

      await waitFor(() =>
        expect(descargarFactura).toHaveBeenCalledWith(
          'TXN11311703245',
          'NORMAL',
        ),
      )
    })

    it('en ticket, para la impresora térmica', async () => {
      // Existía en el backend desde que se escribió el módulo de impresión y
      // ninguna pantalla lo había pedido nunca.
      montar()

      await userEvent.click(screen.getByRole('button', { name: /En ticket/i }))

      await waitFor(() =>
        expect(descargarFactura).toHaveBeenCalledWith(
          'TXN11311703245',
          'TERMICA',
        ),
      )
    })

    it('las dos formas están a la vista, no escondidas en un menú', () => {
      montar()

      expect(screen.getByRole('button', { name: /En hoja/i })).toBeVisible()
      expect(screen.getByRole('button', { name: /En ticket/i })).toBeVisible()
    })
  })
})
