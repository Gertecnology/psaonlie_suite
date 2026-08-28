import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/api-client', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/utils/api-client'
import { BancardCheckout } from './bancard-checkout'

/**
 * El formulario de Bancard dentro del panel.
 *
 * Los datos de la tarjeta nunca pasan por nuestro código: el SDK dibuja su
 * propio iframe. Lo que se prueba acá es que se pida un proceso por venta, que
 * no se pidan dos, y que un fallo diga qué hacer en vez de dejar la pantalla
 * en blanco con un cliente esperando.
 */
describe('el pago con tarjeta en la caja', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset()
    // El SDK cargado, para no depender de la red en el test.
    window.Bancard = { Checkout: { createForm: vi.fn() } }
  })

  it('pide el proceso para esa venta', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ processId: 'proc-1' } as never)

    render(<BancardCheckout ventaId='v-1' />)

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1))

    const [ruta, opciones] = vi.mocked(apiFetch).mock.calls[0]

    expect(ruta).toBe('/api/pagos/bancard/iniciar')
    expect(String(opciones?.body)).toContain('v-1')
  })

  it('dibuja el formulario con el proceso que devolvió', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ processId: 'proc-1' } as never)

    render(<BancardCheckout ventaId='v-1' />)

    await waitFor(() =>
      expect(window.Bancard?.Checkout?.createForm).toHaveBeenCalledWith(
        'bancard-v-1',
        'proc-1',
      ),
    )
  })

  it('acepta también process_id, como lo nombra la pasarela', async () => {
    // Bancard responde en snake_case; el backend a veces lo normaliza y a
    // veces lo pasa tal cual.
    vi.mocked(apiFetch).mockResolvedValue({ process_id: 'proc-2' } as never)

    render(<BancardCheckout ventaId='v-2' />)

    await waitFor(() =>
      expect(window.Bancard?.Checkout?.createForm).toHaveBeenCalledWith(
        'bancard-v-2',
        'proc-2',
      ),
    )
  })

  it('NO abre dos procesos para la misma venta', async () => {
    // Cada `iniciar` abre una operación en Bancard. En desarrollo el efecto
    // corre dos veces por el StrictMode: sin el guardia quedaban dos abiertas.
    vi.mocked(apiFetch).mockResolvedValue({ processId: 'proc-1' } as never)

    const { rerender } = render(<BancardCheckout ventaId='v-1' />)

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1))
    rerender(<BancardCheckout ventaId='v-1' />)

    expect(apiFetch).toHaveBeenCalledTimes(1)
  })

  describe('cuando algo falla', () => {
    it('dice qué hacer, no deja la pantalla en blanco', async () => {
      vi.mocked(apiFetch).mockRejectedValue(
        new Error('Bancard no responde en este momento.'),
      )

      render(<BancardCheckout ventaId='v-1' />)

      expect(
        await screen.findByText('Bancard no responde en este momento.'),
      ).toBeInTheDocument()

      // Lo importante para quien está en el mostrador: la venta no se perdió.
      expect(screen.getByText(/La venta quedó reservada/)).toBeInTheDocument()
      expect(screen.getByText(/cobrar por otro medio/)).toBeInTheDocument()
    })

    it('avisa si la pasarela no devolvió el proceso', async () => {
      vi.mocked(apiFetch).mockResolvedValue({} as never)

      render(<BancardCheckout ventaId='v-1' />)

      expect(
        await screen.findByText(/no devolvió el identificador/),
      ).toBeInTheDocument()
    })

    it('le avisa a quien lo montó', async () => {
      const onError = vi.fn()
      vi.mocked(apiFetch).mockRejectedValue(new Error('falló'))

      render(<BancardCheckout ventaId='v-1' onError={onError} />)

      await waitFor(() => expect(onError).toHaveBeenCalledWith('falló'))
    })
  })

  describe('lo que necesita Bancard para abrir el proceso', () => {
    it('manda a dónde vuelve el cliente', async () => {
      // El backend las exige con `@IsUrl()`. Sin ellas rechazaba el proceso con
      // «returnUrl must be a URL address» y el formulario nunca se dibujaba.
      vi.mocked(apiFetch).mockResolvedValue({ processId: 'proc-1' } as never)

      render(<BancardCheckout ventaId='v-1' />)

      await waitFor(() => expect(apiFetch).toHaveBeenCalled())

      const [, opciones] = vi.mocked(apiFetch).mock.calls[0]
      const enviado = JSON.parse(String(opciones?.body))

      expect(enviado.returnUrl).toMatch(/^https?:\/\//)
      expect(enviado.cancelUrl).toMatch(/^https?:\/\//)
    })

    it('las dos vuelven al panel, no a la landing', async () => {
      // Quien está pagando es un cliente en el mostrador: al terminar, la
      // pantalla vuelve al vendedor.
      vi.mocked(apiFetch).mockResolvedValue({ processId: 'proc-1' } as never)

      render(<BancardCheckout ventaId='v-1' />)

      await waitFor(() => expect(apiFetch).toHaveBeenCalled())

      const [, opciones] = vi.mocked(apiFetch).mock.calls[0]
      const enviado = JSON.parse(String(opciones?.body))

      expect(enviado.returnUrl).toContain(window.location.origin)
      expect(enviado.cancelUrl).toContain(window.location.origin)
    })

    it('y sigue mandando de qué venta se trata', async () => {
      vi.mocked(apiFetch).mockResolvedValue({ processId: 'proc-1' } as never)

      render(<BancardCheckout ventaId='v-1' />)

      await waitFor(() => expect(apiFetch).toHaveBeenCalled())

      const [, opciones] = vi.mocked(apiFetch).mock.calls[0]

      expect(JSON.parse(String(opciones?.body)).ventaId).toBe('v-1')
    })
  })
})
