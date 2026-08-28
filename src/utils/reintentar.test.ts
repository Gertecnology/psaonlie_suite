import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError } from './api-client'
import { convieneReintentar, esRespuestaDelServidor } from './reintentar'

/**
 * Cuándo insistir con una consulta que falló.
 *
 * La regla anterior sólo perdonaba 401 y 403, y sólo si el error era un
 * `AxiosError` — pero en este panel nadie pide datos con axios. La excepción no
 * se cumplía nunca, así que un 404 se reintentaba cuatro veces con espera
 * creciente: quince segundos hasta que la pantalla podía decir qué pasó.
 */
describe('cuándo conviene reintentar', () => {
  const respuesta = (status: number) => new ApiError(`Error ${status}`, status)

  it('no insiste con lo que el servidor ya rechazó', () => {
    expect(convieneReintentar(0, respuesta(400))).toBe(false)
    expect(convieneReintentar(0, respuesta(401))).toBe(false)
    expect(convieneReintentar(0, respuesta(403))).toBe(false)
    expect(convieneReintentar(0, respuesta(404))).toBe(false)
    expect(convieneReintentar(0, respuesta(422))).toBe(false)
  })

  /** Puede haber una instancia caída y otra que responde. */
  it('insiste con un error del servidor', () => {
    expect(convieneReintentar(0, respuesta(500))).toBe(true)
    expect(convieneReintentar(0, respuesta(502))).toBe(true)
    expect(convieneReintentar(0, respuesta(503))).toBe(true)
  })

  /** Una red cortada es justamente el caso para el que reintentar existe. */
  it('insiste cuando nunca se llegó a hablar con el servidor', () => {
    expect(convieneReintentar(0, new TypeError('Failed to fetch'))).toBe(true)
    expect(convieneReintentar(0, undefined)).toBe(true)
  })

  it('se rinde después del cuarto intento', () => {
    expect(convieneReintentar(3, respuesta(500))).toBe(true)
    expect(convieneReintentar(4, respuesta(500))).toBe(false)
  })

  it('reconoce el status venga de donde venga', () => {
    const deAxios = new AxiosError('No existe')
    deAxios.response = { status: 404 } as AxiosError['response']

    expect(esRespuestaDelServidor(deAxios)).toBe(true)
    expect(esRespuestaDelServidor(respuesta(404))).toBe(true)
    expect(esRespuestaDelServidor(new Error('sin status'))).toBe(false)
  })
})
