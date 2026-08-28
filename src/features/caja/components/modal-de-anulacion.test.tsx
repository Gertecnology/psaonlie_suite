import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/api-client', () => ({
  apiFetch: vi.fn(),
  apiDownload: vi.fn(),
  descargarBlob: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { toast } from 'sonner'
import { apiFetch } from '@/utils/api-client'
import { ModalDeAnulacion } from './modal-de-anulacion'

/**
 * Anular una venta, de punta a punta.
 *
 * Es la única acción de esta pantalla que mueve plata: le devuelve al cliente,
 * revierte lo que se le debía a la transportista y le quita al vendedor su
 * comisión. Lo que se prueba acá son los frenos.
 */
describe('anular una venta', () => {
  const LA_VENTA = {
    ventaId: 'v-1',
    numeroTransaccion: 'TXN87593508090',
    monto: 'Gs. 84.000',
  }

  const montar = () => {
    const cliente = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    })

    const onClose = vi.fn()

    render(
      <QueryClientProvider client={cliente}>
        <ModalDeAnulacion venta={LA_VENTA} onClose={onClose} />
      </QueryClientProvider>,
    )

    return { onClose, usuario: userEvent.setup() }
  }

  beforeEach(() => {
    vi.mocked(apiFetch)
      .mockReset()
      .mockResolvedValue({ success: true, message: 'Venta anulada' } as never)
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  describe('antes de anular', () => {
    it('avisa qué pasa con la plata', () => {
      // Quien aprieta el botón tiene que saber que devuelve 84.000 y que le
      // quita la comisión a alguien.
      montar()

      expect(screen.getByText(/Gs\. 84\.000/)).toBeInTheDocument()
      expect(screen.getByText(/le quita al vendedor su comisión/)).toBeInTheDocument()
    })

    it('el botón arranca deshabilitado', () => {
      montar()

      expect(screen.getByRole('button', { name: 'Anular' })).toBeDisabled()
    })

    it('exige un motivo de verdad, no una palabra', async () => {
      // Dentro de tres meses ese texto es lo único que explica la anulación.
      const { usuario } = montar()

      await usuario.type(screen.getByLabelText('Motivo'), 'error')

      expect(screen.getByRole('button', { name: 'Anular' })).toBeDisabled()
      expect(screen.getByText(/Al menos 10 caracteres/)).toBeInTheDocument()
    })

    it('habilita cuando el motivo alcanza', async () => {
      const { usuario } = montar()

      await usuario.type(
        screen.getByLabelText('Motivo'),
        'El cliente se arrepintió antes de la salida',
      )

      expect(screen.getByRole('button', { name: 'Anular' })).toBeEnabled()
    })
  })

  describe('al anular', () => {
    const anular = async () => {
      const { usuario, onClose } = montar()

      await usuario.type(
        screen.getByLabelText('Motivo'),
        'El cliente se arrepintió antes de la salida',
      )
      await usuario.click(screen.getByRole('button', { name: 'Anular' }))

      return { onClose }
    }

    it('manda el motivo al backend', async () => {
      await anular()

      await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1))

      const [ruta, opciones] = vi.mocked(apiFetch).mock.calls[0]

      expect(ruta).toBe('/api/ventas/v-1/cancelar')
      expect(opciones?.method).toBe('POST')
      expect(String(opciones?.body)).toContain('se arrepintió')
    })

    it('cierra y avisa cuando salió bien', async () => {
      const { onClose } = await anular()

      await waitFor(() => expect(onClose).toHaveBeenCalled())
      expect(toast.success).toHaveBeenCalledWith('Venta anulada')
    })
  })

  describe('cuando el backend dice que no', () => {
    it('muestra el motivo real, no un "no tenés permiso"', async () => {
      // El 403 dice a quién pedirle que lo haga: quien lo lee está en un
      // mostrador con un cliente enfrente.
      vi.mocked(apiFetch).mockRejectedValue(
        new Error(
          'La venta TXN87593508090 la hizo otro vendedor: pedile a un administrador que la anule.',
        ),
      )

      const { usuario, onClose } = montar()

      await usuario.type(
        screen.getByLabelText('Motivo'),
        'El cliente se arrepintió antes de la salida',
      )
      await usuario.click(screen.getByRole('button', { name: 'Anular' }))

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          'No se pudo anular la venta',
          expect.objectContaining({
            description: expect.stringContaining('otro vendedor'),
          }),
        ),
      )

      // Y no se cierra: el motivo escrito se conserva para reintentar.
      expect(onClose).not.toHaveBeenCalled()
    })
  })
})
