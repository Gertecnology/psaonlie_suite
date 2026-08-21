import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerEstadisticasPagos } from './conciliacion.service'

/**
 * Este service existe para recuperar datos que el backend pierde por el camino.
 *
 * Las consultas usan alias SQL sin comillas (`COUNT(*) as totalTransacciones`).
 * Postgres los pliega a minúsculas, así que `getRawOne()` devuelve
 * `totaltransacciones` y `montoaprobado`. El backend después lee la grafía
 * camelCase, que no existe, y termina informando `tasaExito: 0`,
 * `montoTotalProcesado: 0` y `totalTransacciones: null` — con Gs 13.398.550
 * reales detrás de esos ceros.
 *
 * Los datos crudos sí llegan. Leerlos sin distinguir mayúsculas hace que el
 * informe muestre los números reales hoy, y siga funcionando cuando el backend
 * entrecomille los alias.
 */

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  localStorage.setItem('accessToken', 'token-de-prueba')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function responder(cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

const PERIODO = {
  fechaDesde: '2026-08-01T03:00:00.000Z',
  fechaHasta: '2026-08-22T02:59:59.999Z',
}

describe('obtenerEstadisticasPagos', () => {
  it('recupera los montos de las claves en minúsculas', async () => {
    // Ésta es la forma real que devuelve producción hoy.
    fetchMock.mockResolvedValue(
      responder({
        bancard: {
          totaltransacciones: '20',
          aprobadas: '15',
          rechazadas: '3',
          canceladas: '1',
          expiradas: '1',
          montoaprobado: '13398550.00',
          promediominutospago: '4.5',
          conteosPorEstado: {},
          tasaExito: 0,
        },
        pagosManules: {
          totalcomprobantes: '8',
          aprobados: '6',
          rechazados: '1',
          pendientes: '1',
          tasaAprobacion: 0,
        },
        resumen: {
          totalTransacciones: null,
          tasaExitoGeneral: 0,
          montoTotalProcesado: 0,
        },
      }),
    )

    const resultado = await obtenerEstadisticasPagos(PERIODO)

    expect(resultado.bancard.montoAprobado).toBe(13_398_550)
    expect(resultado.bancard.totalTransacciones).toBe(20)
    expect(resultado.bancard.aprobadas).toBe(15)
    expect(resultado.manuales.totalComprobantes).toBe(8)
  })

  it('recalcula la tasa de éxito en vez de confiar en el 0 del backend', async () => {
    fetchMock.mockResolvedValue(
      responder({
        bancard: { totaltransacciones: '20', aprobadas: '15', tasaExito: 0 },
        pagosManules: {},
      }),
    )

    const resultado = await obtenerEstadisticasPagos(PERIODO)
    expect(resultado.bancard.tasaExito).toBe(75)
  })

  it('sigue funcionando si el backend corrige los alias', async () => {
    fetchMock.mockResolvedValue(
      responder({
        bancard: {
          totalTransacciones: 20,
          aprobadas: 15,
          montoAprobado: 13398550,
        },
        pagosManules: { totalComprobantes: 8, aprobados: 6 },
      }),
    )

    const resultado = await obtenerEstadisticasPagos(PERIODO)
    expect(resultado.bancard.montoAprobado).toBe(13_398_550)
    expect(resultado.bancard.tasaExito).toBe(75)
    expect(resultado.manuales.tasaAprobacion).toBe(75)
  })

  it('contempla la clave mal escrita "pagosManules" y la correcta', async () => {
    fetchMock.mockResolvedValue(
      responder({ bancard: {}, pagosManuales: { totalComprobantes: 4 } }),
    )

    const resultado = await obtenerEstadisticasPagos(PERIODO)
    expect(resultado.manuales.totalComprobantes).toBe(4)
  })

  it('no divide por cero cuando no hubo transacciones', async () => {
    fetchMock.mockResolvedValue(responder({ bancard: {}, pagosManules: {} }))

    const resultado = await obtenerEstadisticasPagos(PERIODO)
    expect(resultado.bancard.tasaExito).toBe(0)
    expect(resultado.manuales.tasaAprobacion).toBe(0)
    expect(resultado.bancard.montoAprobado).toBe(0)
  })

  it('manda el período como query params', async () => {
    fetchMock.mockResolvedValue(responder({ bancard: {}, pagosManules: {} }))
    await obtenerEstadisticasPagos(PERIODO)

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('/api/pagos/estadisticas/resumen?')
    expect(url).toContain('fechaDesde=')
    expect(url).toContain('fechaHasta=')
  })
})
