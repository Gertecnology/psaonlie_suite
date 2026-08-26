import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch, apiFetchRaw } from './api-client'

function mockearRespuesta(body: unknown, status = 200) {
  const fetchMock = vi.fn(
    async () =>
      ({
        ok: status < 400,
        status,
        text: async () => (body === undefined ? '' : JSON.stringify(body)),
      }) as unknown as Response,
  )
  vi.stubGlobal('fetch', fetchMock)

  return {
    fetchMock,
    llamadas: () =>
      fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit?]>,
  }
}

/** Extrae el ApiError de una promesa rechazada, con el tipo puesto. */
async function capturarError(promesa: Promise<unknown>): Promise<ApiError> {
  try {
    await promesa
    throw new Error('Se esperaba que la promesa fuera rechazada')
  } catch (error) {
    return error as ApiError
  }
}

afterEach(() => {
  localStorage.clear()
})

describe('apiFetch (endpoints con envelope)', () => {
  it('devuelve data desenvuelta', async () => {
    mockearRespuesta({
      success: true,
      statusCode: 200,
      message: 'ok',
      data: { id: '1' },
    })

    await expect(apiFetch('/destinos/1')).resolves.toEqual({ id: '1' })
  })

  it('LANZA cuando el backend responde 200 con success: false', async () => {
    // El backend viejo devuelve 200/201 aunque la operación haya fallado.
    // Decidir sólo con `response.ok` era lo que producía el toast verde
    // sobre una operación que no pasó.
    mockearRespuesta(
      {
        success: false,
        statusCode: 500,
        message: 'No se pudo actualizar la empresa',
      },
      200,
    )

    await expect(apiFetch('/agencias/1')).rejects.toThrow(
      /No se pudo actualizar la empresa/,
    )
  })

  it('LANZA con el status real cuando el backend responde 4xx', async () => {
    mockearRespuesta({ statusCode: 404, message: 'No encontrado' }, 404)

    const error = await capturarError(apiFetch('/destinos/9'))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.statusCode).toBe(404)
  })
})

describe('apiFetchRaw (endpoints sin envelope)', () => {
  it('devuelve el cuerpo tal cual, sin buscar data', async () => {
    mockearRespuesta({ exitoso: true, codigoReferencia: 'REF-1' })

    await expect(apiFetchRaw('/api/ventas/bloquear-asientos')).resolves.toEqual({
      exitoso: true,
      codigoReferencia: 'REF-1',
    })
  })

  it('adjunta el token cuando hay sesión', async () => {
    localStorage.setItem('accessToken', 'jwt-123')
    const api = mockearRespuesta({ ok: true })

    await apiFetchRaw('/api/clientes')

    const [, init] = api.llamadas()[0]
    const headers = init?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer jwt-123')
  })

  it('no manda "Bearer null" cuando no hay sesión', async () => {
    const api = mockearRespuesta({ ok: true })

    await apiFetchRaw('/api/clientes')

    const [, init] = api.llamadas()[0]
    const headers = init?.headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it('convierte un fallo de red en un mensaje entendible', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch')
      }),
    )

    const error = await capturarError(apiFetchRaw('/api/clientes'))
    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toMatch(/No se pudo conectar con el servidor/)
  })

  it('corta la request por timeout y avisa que puede haber quedado a medias', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          }),
      ),
    )

    const error = await capturarError(
      apiFetchRaw('/api/ventas/confirmar-nueva', { timeoutMs: 5 }),
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('TIMEOUT')
    expect(error.message).toMatch(/tardó demasiado/)
  })

  it('trata un 204 sin cuerpo como éxito', async () => {
    mockearRespuesta(undefined, 204)
    await expect(apiFetchRaw('/api/clientes/1')).resolves.toBeUndefined()
  })
})
