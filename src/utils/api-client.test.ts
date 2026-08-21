import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiDownload, apiFetch, esEnvelope } from './api-client'

/**
 * La capa de red tiene que convivir con dos contratos a la vez.
 *
 * Verificado el 21/08/2026 contra el backend:
 * - `empresas`, `agencias`, `destinos` responden con envelope
 *   (`{ success, statusCode, message, data }`), armado a mano.
 * - `api/admin/ventas/*`, `api/pagos/*` y `api/boletos/*` responden con el
 *   objeto **pelado**.
 * - Los errores de **todas** las rutas pasan por el filtro global y sí vienen
 *   con envelope, con el status HTTP real.
 *
 * Antes, `apiFetch` devolvía siempre `body.data`: contra un endpoint sin sobre
 * eso es `undefined`, o sea una pantalla vacía sin ningún error visible.
 */

function responderCon(cuerpo: unknown, init: ResponseInit = {}) {
  return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  localStorage.setItem('accessToken', 'token-de-prueba')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('esEnvelope', () => {
  it('reconoce el sobre por sus dos marcas juntas', () => {
    expect(esEnvelope({ success: true, statusCode: 200, message: 'ok' })).toBe(
      true
    )
  })

  it('no confunde con el sobre a las respuestas de los jobs', () => {
    // `POST /api/admin/jobs/ejecutar/:job` responde `{ success, resultado,
    // mensaje }`: tiene `success` pero el objeto entero ES el payload.
    expect(esEnvelope({ success: true, resultado: {}, mensaje: 'ok' })).toBe(
      false
    )
  })

  it('no toma por sobre a un DTO de negocio', () => {
    expect(esEnvelope({ data: [], total: 5, page: 1 })).toBe(false)
    expect(esEnvelope([])).toBe(false)
    expect(esEnvelope(null)).toBe(false)
    expect(esEnvelope('texto')).toBe(false)
  })
})

describe('apiFetch — respuestas exitosas', () => {
  it('desenvuelve `data` cuando viene el sobre', async () => {
    fetchMock.mockResolvedValue(
      responderCon({
        success: true,
        statusCode: 200,
        message: 'Empresas obtenidas exitosamente',
        data: { items: [{ id: 'e1' }], total: 1 },
      })
    )

    const resultado = await apiFetch<{ items: unknown[]; total: number }>(
      '/empresas'
    )
    expect(resultado).toEqual({ items: [{ id: 'e1' }], total: 1 })
  })

  it('devuelve el cuerpo entero cuando NO viene el sobre', async () => {
    // La forma real de `/api/admin/ventas/lista`.
    const pelado = { data: [{ id: 'v1' }], total: 1, page: 1, totalPages: 1 }
    fetchMock.mockResolvedValue(responderCon(pelado))

    expect(await apiFetch('/api/admin/ventas/lista')).toEqual(pelado)
  })

  it('devuelve undefined ante un 204 sin cuerpo', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))
    expect(await apiFetch('/empresas/e1')).toBeUndefined()
  })

  it('adjunta el token de acceso', async () => {
    fetchMock.mockResolvedValue(responderCon({ ok: true }))
    await apiFetch('/api/admin/ventas/estadisticas')

    const [, init] = fetchMock.mock.calls[0]
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer token-de-prueba'
    )
  })

  it('no manda Authorization si no hay sesión', async () => {
    localStorage.removeItem('accessToken')
    fetchMock.mockResolvedValue(responderCon({ ok: true }))
    await apiFetch('/api/admin/ventas/estadisticas')

    const [, init] = fetchMock.mock.calls[0]
    expect(
      (init.headers as Record<string, string>).Authorization
    ).toBeUndefined()
  })
})

describe('apiFetch — errores', () => {
  it('lanza con el mensaje real del backend ante un status de error', async () => {
    fetchMock.mockResolvedValue(
      responderCon(
        {
          success: false,
          statusCode: 404,
          message: 'Venta no encontrada',
          error: { code: 'NotFoundException' },
        },
        { status: 404 }
      )
    )

    await expect(apiFetch('/api/admin/ventas/lista')).rejects.toMatchObject({
      message: 'Venta no encontrada',
      statusCode: 404,
      code: 'NotFoundException',
    })
  })

  it('detecta el fallo aunque el status sea 200', async () => {
    // El backend viejo sigue desplegado en producción: responde 200 con
    // `success: false` adentro. Decidir sólo con `response.ok` mostraba un
    // toast verde sobre una operación que falló.
    fetchMock.mockResolvedValue(
      responderCon({
        success: false,
        statusCode: 500,
        message: 'Error interno del servidor',
      })
    )

    await expect(apiFetch('/empresas')).rejects.toThrow(
      'Error interno del servidor'
    )
  })

  it('lee el mensaje de los endpoints que usan la clave "mensaje"', async () => {
    // `JobsController` responde HTTP 200 con `{ success: false, mensaje }`.
    fetchMock.mockResolvedValue(
      responderCon({
        success: false,
        resultado: null,
        mensaje: 'El job falló al ejecutarse',
      })
    )

    await expect(
      apiFetch('/api/admin/jobs/ejecutar/reconciliar', { method: 'POST' })
    ).rejects.toThrow('El job falló al ejecutarse')
  })

  it('usa el mensaje de reserva cuando el cuerpo no es JSON', async () => {
    // Un 502 de un proxy devuelve HTML, no JSON.
    fetchMock.mockResolvedValue(
      new Response('<html>Bad Gateway</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html' },
      })
    )

    await expect(
      apiFetch('/api/admin/ventas/lista', {
        fallbackMessage: 'No se pudo obtener el listado de ventas.',
      })
    ).rejects.toMatchObject({
      message: 'No se pudo obtener el listado de ventas.',
      statusCode: 502,
    })
  })

  it('distingue un fallo de red de un error del servidor', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const error = await apiFetch('/empresas').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).statusCode).toBe(0)
    expect((error as ApiError).message).toContain('No se pudo conectar')
  })
})

describe('apiDownload', () => {
  it('devuelve el archivo y su nombre', async () => {
    fetchMock.mockResolvedValue(
      new Response('binario', {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition':
            'attachment; filename=ventas_export_20260821T120000.xlsx',
        },
      })
    )

    const { blob, nombreArchivo } = await apiDownload(
      '/api/admin/ventas/exportar?formato=xlsx'
    )
    expect(blob.size).toBeGreaterThan(0)
    expect(nombreArchivo).toBe('ventas_export_20260821T120000.xlsx')
  })

  it('no descarga un error como si fuera un Excel', async () => {
    // El bug que reemplaza: `response.blob()` sin chequear `ok` bajaba el JSON
    // del error con extensión .xlsx y mostraba un toast de éxito.
    fetchMock.mockResolvedValue(
      responderCon(
        {
          success: false,
          statusCode: 500,
          message: 'Error al exportar las ventas',
        },
        { status: 500 }
      )
    )

    await expect(apiDownload('/api/admin/ventas/exportar')).rejects.toThrow(
      'Error al exportar las ventas'
    )
  })

  it('rechaza un 200 que devuelve JSON en vez del archivo', async () => {
    fetchMock.mockResolvedValue(
      responderCon({ success: false, statusCode: 200, message: 'Sin datos' })
    )

    await expect(apiDownload('/api/admin/ventas/exportar')).rejects.toThrow(
      'Sin datos'
    )
  })
})
