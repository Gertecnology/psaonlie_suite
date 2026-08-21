import { describe, expect, it, vi } from 'vitest'
import {
  BloqueoAsientosError,
  bloquearAsientos,
  liberarBloqueo,
} from './sales.service'

interface RespuestaMock {
  status?: number
  body: unknown
}

/**
 * Devuelve el mock de fetch instalado, para inspeccionar las llamadas.
 * Las respuestas se consumen en orden; la última se repite indefinidamente.
 */
function mockearRespuestas(...respuestas: RespuestaMock[]) {
  let indice = 0

  const fetchMock = vi.fn(async () => {
    const siguiente = respuestas[Math.min(indice, respuestas.length - 1)]
    indice += 1

    return {
      ok: (siguiente.status ?? 201) < 400,
      status: siguiente.status ?? 201,
      text: async () => JSON.stringify(siguiente.body),
    } as unknown as Response
  })

  vi.stubGlobal('fetch', fetchMock)

  return {
    fetchMock,
    llamadas: () =>
      fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit?]>,
  }
}

const PARAMS = {
  servicioId: 'SRV-1',
  origenId: 'ORI-1',
  destinoId: 'DES-1',
  empresaId: 'EMP-1',
  asientos: ['5', '6'],
}

describe('bloquearAsientos', () => {
  it('devuelve el bloqueo cuando la empresa reservó todos los asientos pedidos', async () => {
    mockearRespuestas({
      body: {
        exitoso: true,
        codigoReferencia: 'REF-123',
        nroConexion: '9',
        tiempoExpiracion: '2026-08-21T12:30:00.000Z',
        // El backend devuelve los asientos con ceros a la izquierda.
        asientosBloqueados: ['05', '06'],
        asientosNoDisponibles: [],
        mensaje: '2 asientos bloqueados exitosamente por 30 minutos',
      },
    })

    const resultado = await bloquearAsientos(PARAMS)

    expect(resultado.codigoReferencia).toBe('REF-123')
    expect(resultado.asientosBloqueados).toEqual(['05', '06'])
  })

  it('LANZA cuando el backend responde 201 con exitoso: false', async () => {
    // Este es el bug que costó las ventas pagadas sin boleto: el endpoint
    // responde HTTP 201 aunque no haya bloqueado nada.
    const api = mockearRespuestas({
      status: 201,
      body: {
        exitoso: false,
        codigoReferencia: '',
        nroConexion: '',
        tiempoExpiracion: '2026-08-21T12:00:00.000Z',
        asientosBloqueados: [],
        asientosNoDisponibles: ['05', '06'],
        mensaje: 'Ningún asiento está disponible para bloqueo',
      },
    })

    await expect(bloquearAsientos(PARAMS)).rejects.toThrow(BloqueoAsientosError)
    await expect(bloquearAsientos(PARAMS)).rejects.toThrow(
      /Ningún asiento está disponible/,
    )

    // No hay bloqueo que liberar: no se llama a liberar-bloqueo.
    const urls = api.llamadas().map(([url]) => String(url))
    expect(urls.some((url) => url.includes('liberar-bloqueo'))).toBe(false)
  })

  it('LANZA con el detalle cuando el backend responde 409 (butaca tomada)', async () => {
    // El backend corregido ya no responde 201 sobre un bloqueo fallido: manda
    // 409 y el detalle de qué butacas no estaban disponibles va en el cuerpo
    // del error. Hay que rescatarlo de ahí para poder decírselo al operador.
    mockearRespuestas({
      status: 409,
      body: {
        success: false,
        statusCode: 409,
        message: 'Alguna de las butacas seleccionadas ya no está disponible.',
        error: {
          code: 'ConflictException',
          details: {
            message: 'Alguna de las butacas seleccionadas ya no está disponible.',
            asientosNoDisponibles: ['6'],
            asientosSolicitados: ['5', '6'],
          },
        },
      },
    })

    await expect(bloquearAsientos(PARAMS)).rejects.toMatchObject({
      name: 'BloqueoAsientosError',
      asientosNoBloqueados: ['6'],
    })
  })

  it('LANZA cuando el backend responde 502 (el web service no contestó)', async () => {
    // Sin detalle de butacas: no se sabe cuáles fallaron, así que se reportan
    // todas las pedidas. Reintentar tiene sentido acá, a diferencia del 409.
    mockearRespuestas({
      status: 502,
      body: {
        success: false,
        statusCode: 502,
        message: 'No se pudo confirmar el bloqueo con la empresa de transporte.',
        error: { code: 'BadGatewayException', details: {} },
      },
    })

    await expect(bloquearAsientos(PARAMS)).rejects.toMatchObject({
      name: 'BloqueoAsientosError',
      asientosNoBloqueados: ['5', '6'],
    })
  })

  it('LANZA cuando viene exitoso: true pero sin código de referencia', async () => {
    mockearRespuestas({
      body: {
        exitoso: true,
        codigoReferencia: '',
        nroConexion: '',
        tiempoExpiracion: '',
        asientosBloqueados: ['05'],
        asientosNoDisponibles: [],
        mensaje: 'Bloqueo sin código',
      },
    })

    await expect(bloquearAsientos(PARAMS)).rejects.toThrow(BloqueoAsientosError)
  })

  it('LANZA y libera la reserva cuando el bloqueo es parcial', async () => {
    // `exitoso` es true si se bloqueó AL MENOS UNO. Dar eso por bueno hacía
    // que el checkout vendiera asientos que nunca quedaron reservados.
    const api = mockearRespuestas(
      {
        body: {
          exitoso: true,
          codigoReferencia: 'REF-PARCIAL',
          nroConexion: '9',
          tiempoExpiracion: '2026-08-21T12:30:00.000Z',
          asientosBloqueados: ['05'],
          asientosNoDisponibles: ['06'],
          mensaje: '1 asientos bloqueados exitosamente',
        },
      },
      { status: 200, body: { success: true, message: 'Bloqueo liberado' } },
    )

    const error = await bloquearAsientos(PARAMS).catch((e) => e)

    expect(error).toBeInstanceOf(BloqueoAsientosError)
    expect(error.parcial).toBe(true)
    expect(error.asientosNoBloqueados).toEqual(['6'])
    expect(error.message).toMatch(/Solo se pudieron bloquear 1 de 2 asientos/)

    // La reserva parcial se libera para no retener asientos media hora.
    const urls = api.llamadas().map(([url]) => String(url))
    expect(urls.some((url) => url.includes('liberar-bloqueo/REF-PARCIAL'))).toBe(
      true,
    )
  })

  it('LANZA cuando el backend responde con un error real', async () => {
    mockearRespuestas({
      status: 409,
      body: { message: 'Los asientos ya están tomados', statusCode: 409 },
    })

    await expect(bloquearAsientos(PARAMS)).rejects.toThrow(
      /Los asientos ya están tomados/,
    )
  })

  it('LANZA sin salir a la red cuando no hay asientos seleccionados', async () => {
    const api = mockearRespuestas({ body: {} })

    await expect(
      bloquearAsientos({ ...PARAMS, asientos: [] }),
    ).rejects.toThrow(/al menos un asiento/)

    expect(api.fetchMock).not.toHaveBeenCalled()
  })

  it('manda el token de acceso en la request', async () => {
    localStorage.setItem('accessToken', 'token-de-prueba')

    const api = mockearRespuestas({
      body: {
        exitoso: true,
        codigoReferencia: 'REF-1',
        nroConexion: '1',
        tiempoExpiracion: '',
        asientosBloqueados: ['05', '06'],
        asientosNoDisponibles: [],
        mensaje: 'ok',
      },
    })

    await bloquearAsientos(PARAMS)

    const [, opciones] = api.llamadas()[0]
    const headers = opciones?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer token-de-prueba')

    localStorage.clear()
  })
})

describe('liberarBloqueo', () => {
  it('LANZA cuando el backend responde success: false', async () => {
    mockearRespuestas({
      status: 200,
      body: { success: false, message: 'No se encontró el bloqueo' },
    })

    await expect(liberarBloqueo('REF-1')).rejects.toThrow(
      /No se encontró el bloqueo/,
    )
  })

  it('resuelve cuando el backend confirma la liberación', async () => {
    mockearRespuestas({
      status: 200,
      body: { success: true, message: 'Bloqueo liberado exitosamente' },
    })

    await expect(liberarBloqueo('REF-1')).resolves.toMatchObject({
      success: true,
    })
  })
})
