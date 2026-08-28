import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/utils/api-client'
import {
  marcarPredeterminado,
  obtenerLibreta,
  quitarTitular,
} from './facturacion.service'

vi.mock('@/utils/api-client', () => ({ apiFetch: vi.fn() }))

const pedido = vi.mocked(apiFetch)

/**
 * La libreta de facturación contra la API.
 *
 * Lo que se prueba acá es la frontera: qué dirección se pide, con qué método, y
 * qué devuelve la función cuando el backend contesta algo que la pantalla no
 * espera.
 */
describe('la libreta de facturación', () => {
  beforeEach(() => {
    pedido.mockReset()
  })

  it('pide la libreta del cliente', async () => {
    pedido.mockResolvedValue([])

    await obtenerLibreta('cli-1')

    expect(pedido).toHaveBeenCalledWith(
      '/api/clientes/cli-1/facturacion',
      expect.objectContaining({ fallbackMessage: expect.any(String) })
    )
  })

  /**
   * `apiFetch` devuelve `undefined` cuando la respuesta no trae `data`, y la
   * tabla hace `.map` sobre lo que salga de acá.
   */
  it('devuelve una lista vacía si el backend no manda nada', async () => {
    pedido.mockResolvedValue(undefined)

    await expect(obtenerLibreta('cli-1')).resolves.toEqual([])
  })

  it('escapa el id del cliente en la dirección', async () => {
    pedido.mockResolvedValue([])

    await obtenerLibreta('cli/1 raro')

    expect(pedido).toHaveBeenCalledWith(
      '/api/clientes/cli%2F1%20raro/facturacion',
      expect.anything()
    )
  })

  it('marca el predeterminado con POST', async () => {
    pedido.mockResolvedValue(undefined)

    await marcarPredeterminado('cli-1', 'tit-9')

    expect(pedido).toHaveBeenCalledWith(
      '/api/clientes/cli-1/facturacion/tit-9/predeterminado',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('quita un titular con DELETE', async () => {
    pedido.mockResolvedValue(undefined)

    await quitarTitular('cli-1', 'tit-9')

    expect(pedido).toHaveBeenCalledWith(
      '/api/clientes/cli-1/facturacion/tit-9',
      expect.objectContaining({ method: 'DELETE' })
    )
  })

  it('propaga el error del backend en vez de tragarlo', async () => {
    pedido.mockRejectedValue(new Error('El titular tiene facturas emitidas.'))

    await expect(quitarTitular('cli-1', 'tit-9')).rejects.toThrow(
      'El titular tiene facturas emitidas.'
    )
  })
})
