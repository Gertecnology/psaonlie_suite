import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  normalizarEstadisticas,
  obtenerEstadisticas,
} from './estadisticas.service'

/**
 * La normalización existe por un motivo verificado, no por precaución.
 *
 * Las columnas `decimal`/`numeric` de Postgres y los `COUNT(*)` llegan como
 * **string** aunque los DTO del backend los declaren `number`. Sumar dos de
 * esos con `+` concatena en vez de sumar, y `Math.max` sobre strings ordena
 * alfabéticamente ("9" > "100").
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

describe('normalizarEstadisticas', () => {
  it('convierte a número los montos que llegan como string', () => {
    const normalizado = normalizarEstadisticas({
      periodo: { fechaDesde: '2026-08-01', fechaHasta: '2026-08-21' },
      generales: {
        totalVentas: '33',
        montoCompletado: '13398550.00',
        comisionesPagadas: '1339855.00',
        serviceChargesPagados: '165000.00',
      },
    })

    expect(normalizado.generales.totalVentas).toBe(33)
    expect(normalizado.generales.montoCompletado).toBe(13_398_550)
    expect(normalizado.generales.comisionesPagadas).toBe(1_339_855)

    // Que la suma sea aritmética y no concatenación es todo el punto.
    const suma =
      normalizado.generales.montoCompletado +
      normalizado.generales.serviceChargesPagados
    expect(suma).toBe(13_563_550)
  })

  it('completa con 0 los campos que el backend no devuelve', () => {
    const normalizado = normalizarEstadisticas({ generales: {} })
    expect(normalizado.generales.montoPendiente).toBe(0)
    expect(normalizado.generales.totalBoletos).toBe(0)
    expect(normalizado.generales.tasaConversion).toBe(0)
  })

  it('sobrevive a una respuesta vacía o inesperada', () => {
    // Si el backend cambia y devuelve otra cosa, el panel muestra ceros, no
    // una pantalla en blanco con un TypeError en la consola.
    for (const entrada of [null, undefined, {}, 'texto', []]) {
      const normalizado = normalizarEstadisticas(entrada)
      expect(normalizado.generales.totalVentas).toBe(0)
      expect(normalizado.porEmpresa).toEqual([])
      expect(normalizado.temporales).toEqual([])
    }
  })

  it('descarta las filas que no son objetos', () => {
    const normalizado = normalizarEstadisticas({
      porEmpresa: [null, 'basura', { empresaId: 'e1', montoPagado: '100.00' }],
    })
    expect(normalizado.porEmpresa).toHaveLength(1)
    expect(normalizado.porEmpresa[0].montoPagado).toBe(100)
  })

  it('normaliza las listas por empresa, ruta, método y temporales', () => {
    const normalizado = normalizarEstadisticas({
      porEmpresa: [
        {
          empresaId: 'e1',
          empresaNombre: 'Canindeyú',
          cantidad: '5',
          montoPagado: '500.00',
        },
      ],
      porRuta: [
        { origenNombre: 'Asunción', destinoNombre: 'CDE', monto: '900.50' },
      ],
      porMetodoPago: [
        { metodoPago: 'BANCARD', cantidad: '3', monto: '300.00' },
      ],
      temporales: [{ fecha: '2026-08-21', ventas: '2', monto: '250.00' }],
      topClientes: [
        { clienteId: 'c1', nombreCompleto: 'Ana', montoTotal: '99.90' },
      ],
    })

    expect(normalizado.porEmpresa[0].cantidad).toBe(5)
    expect(normalizado.porRuta[0].monto).toBe(900.5)
    expect(normalizado.porMetodoPago[0].cantidad).toBe(3)
    expect(normalizado.temporales[0].monto).toBe(250)
    expect(normalizado.topClientes[0].montoTotal).toBe(99.9)
  })

  it('pone un nombre de reserva cuando falta', () => {
    const normalizado = normalizarEstadisticas({
      porEmpresa: [{ empresaId: 'e1' }],
      porRuta: [{}],
    })
    expect(normalizado.porEmpresa[0].empresaNombre).toBe('Sin nombre')
    expect(normalizado.porRuta[0].origenNombre).toBe('N/A')
  })
})

describe('obtenerEstadisticas', () => {
  it('manda los filtros como query params', async () => {
    fetchMock.mockResolvedValue(responder({ generales: {} }))

    await obtenerEstadisticas({
      fechaDesde: '2026-08-01T03:00:00.000Z',
      fechaHasta: '2026-08-22T02:59:59.999Z',
      empresaId: 'empresa-1',
    })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('/api/admin/ventas/estadisticas?')
    expect(url).toContain('fechaDesde=2026-08-01T03%3A00%3A00.000Z')
    expect(url).toContain('empresaId=empresa-1')
  })

  it('omite los filtros vacíos', async () => {
    fetchMock.mockResolvedValue(responder({ generales: {} }))
    await obtenerEstadisticas({ fechaDesde: '2026-08-01' })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).not.toContain('empresaId')
    expect(url).not.toContain('fechaHasta')
  })

  it('lee la respuesta pelada, sin buscarla dentro de `data`', async () => {
    // `/api/admin/ventas/*` no usa el envelope. Buscar `body.data` acá daba
    // `undefined`, o sea un panel vacío sin ningún error visible.
    fetchMock.mockResolvedValue(
      responder({ generales: { totalVentas: 7 }, porEmpresa: [] })
    )

    const resultado = await obtenerEstadisticas({})
    expect(resultado.generales.totalVentas).toBe(7)
  })

  it('propaga el mensaje real del backend cuando falla', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          statusCode: 403,
          message:
            'No tienes los permisos necesarios (roles insuficientes) para realizar esta acción.',
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    )

    await expect(obtenerEstadisticas({})).rejects.toThrow(
      'No tienes los permisos necesarios'
    )
  })
})
