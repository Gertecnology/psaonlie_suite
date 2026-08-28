import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/utils/api-client'
import { BaseApiService } from './base-api.service'

class ServicioDePrueba extends BaseApiService {
  pedir<T>(endpoint: string) {
    return this.request<T>(endpoint)
  }
}

/**
 * Lo que el servicio base hace con una respuesta que no es 200.
 *
 * Lanzaba un `Error` pelado con el mensaje adentro y nada más. Sin el status,
 * quien recibe el error no puede distinguir «no existe» de «el servidor se
 * cayó», y por eso se reintentaba un 404 cuatro veces antes de mostrarlo.
 */
describe('los errores del servicio base', () => {
  const servicio = new ServicioDePrueba()
  const original = globalThis.fetch

  const responder = (status: number, cuerpo: unknown) => {
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        statusText: 'Not Found',
        json: () => Promise.resolve(cuerpo),
      } as unknown as Response)
    ) as typeof fetch
  }

  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    globalThis.fetch = original
  })

  it('lleva el status del servidor en el error', async () => {
    responder(404, { message: 'Usuario no encontrado.' })

    await expect(servicio.pedir('/api/usuarios/u-1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Usuario no encontrado.',
    })
  })

  it('lanza un ApiError, no un Error cualquiera', async () => {
    responder(422, { message: 'El correo ya está en uso.' })

    await expect(servicio.pedir('/api/usuarios')).rejects.toBeInstanceOf(
      ApiError
    )
  })

  /** Cuando el backend no explica nada, el mensaje lo arma el panel. */
  it('se arregla con un cuerpo que no dice nada', async () => {
    responder(404, {})

    await expect(servicio.pedir('/api/usuarios/u-1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Error 404: Not Found',
    })
  })

  it('devuelve el cuerpo cuando la respuesta es buena', async () => {
    responder(200, { id: 'u-1', email: 'ana@gertecnology.com' })

    await expect(servicio.pedir('/api/usuarios/u-1')).resolves.toEqual({
      id: 'u-1',
      email: 'ana@gertecnology.com',
    })
  })
})
