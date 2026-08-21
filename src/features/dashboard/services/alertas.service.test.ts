import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  obtenerConectividadEmpresas,
  obtenerPagosPorVencer,
  obtenerVentasSinBoleto,
} from './alertas.service'

/**
 * Las alertas son la parte del panel que justifica tenerlo abierto.
 *
 * Cada una tiene su trampa propia, documentada en `alertas.model.ts`, y estos
 * tests fijan justamente esas trampas:
 * - "sin boleto" se deriva del listado porque no hay endpoint de sólo lectura;
 * - los importes de pagos pendientes llegan como string;
 * - la conectividad NO se puede apoyar en `activo`.
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

function venta(parcial: Record<string, unknown>) {
  return {
    id: 'v1',
    numeroTransaccion: 'TX-001',
    empresaNombre: 'Canindeyú',
    fechaVenta: '2026-08-20T10:00:00.000Z',
    fechaViaje: '2026-08-25',
    metodoPago: 'BANCARD',
    estadoPago: 'PAGADO',
    importeTotal: 100000,
    serviceChargeMontoTotal: 5000,
    comisionTotal: 10000,
    totalBoletos: 1,
    datosContacto: {},
    ...parcial,
  }
}

describe('obtenerVentasSinBoleto', () => {
  it('cuenta las ventas pagadas que no emitieron boleto', () => {
    fetchMock.mockResolvedValue(
      responder({
        data: [
          venta({ id: 'v1', totalBoletos: 1 }),
          venta({ id: 'v2', numeroTransaccion: 'TX-002', totalBoletos: 0 }),
          venta({ id: 'v3', numeroTransaccion: 'TX-003', totalBoletos: 0 }),
        ],
        total: 3,
        resumenFiltros: {},
      })
    )

    return obtenerVentasSinBoleto().then((resultado) => {
      expect(resultado.cantidad).toBe(2)
      expect(resultado.detalle.map((v) => v.numeroTransaccion)).toEqual([
        'TX-002',
        'TX-003',
      ])
    })
  })

  it('el monto afectado es lo cobrado al cliente, no sólo el pasaje', async () => {
    // Lo que perdió el cliente es lo que pagó: pasaje + cargo por servicio.
    fetchMock.mockResolvedValue(
      responder({
        data: [venta({ totalBoletos: 0 })],
        total: 1,
        resumenFiltros: {},
      })
    )

    const resultado = await obtenerVentasSinBoleto()
    expect(resultado.montoAfectado).toBe(105_000)
  })

  it('consulta sólo las ventas pagadas, ordenadas por fecha', async () => {
    fetchMock.mockResolvedValue(
      responder({ data: [], total: 0, resumenFiltros: {} })
    )
    await obtenerVentasSinBoleto()

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('estadoPago=PAGADO')
    expect(url).toContain('sortBy=fechaVenta')
    expect(url).toContain('sortOrder=DESC')
  })

  it('avisa cuando sólo pudo analizar una ventana del total', async () => {
    // El backend no tiene un endpoint de sólo lectura para esto, así que el
    // panel dice explícitamente cuántas revisó en vez de simular exactitud.
    fetchMock.mockResolvedValue(
      responder({
        data: [venta({ totalBoletos: 0 })],
        total: 1200,
        resumenFiltros: {},
      })
    )

    const resultado = await obtenerVentasSinBoleto()
    expect(resultado.parcial).toBe(true)
    expect(resultado.analizadas).toBe(1)
    expect(resultado.totalPagadas).toBe(1200)
  })

  it('no marca como parcial cuando revisó todo', async () => {
    fetchMock.mockResolvedValue(
      responder({ data: [venta({})], total: 1, resumenFiltros: {} })
    )
    expect((await obtenerVentasSinBoleto()).parcial).toBe(false)
  })

  it('cae a los datos de contacto cuando no hay cliente cargado', async () => {
    fetchMock.mockResolvedValue(
      responder({
        data: [
          venta({ totalBoletos: 0, datosContacto: { nombre: 'María Duarte' } }),
        ],
        total: 1,
        resumenFiltros: {},
      })
    )

    expect((await obtenerVentasSinBoleto()).detalle[0].cliente).toBe(
      'María Duarte'
    )
  })
})

describe('obtenerPagosPorVencer', () => {
  const AHORA = new Date('2026-08-21T12:00:00.000Z')

  function pago(parcial: Record<string, unknown>) {
    return {
      ventaId: 'v1',
      numeroTransaccion: 'TX-100',
      metodoPago: 'TRANSFERENCIA',
      importeTotal: '150000.00',
      fechaVenta: '2026-08-21T08:00:00.000Z',
      fechaExpiracion: '2026-08-21T20:00:00.000Z',
      empresa: { nombre: 'La Ovetense' },
      ruta: { origen: 'Asunción', destino: 'Encarnación' },
      cliente: { nombre: 'Juan Pérez' },
      tiempoRestante: '8 hora(s) 0 min',
      ...parcial,
    }
  }

  it('convierte a número el importe, que el backend manda como string', async () => {
    // `PagoPendienteDto.importeTotal` está declarado `number` pero nunca pasa
    // por `parseFloat`: llega "150000.00".
    fetchMock.mockResolvedValue(responder({ data: [pago({})], total: 1 }))

    const resultado = await obtenerPagosPorVencer({ ahora: AHORA })
    expect(resultado.porVencer[0].importeTotal).toBe(150_000)
    expect(resultado.montoPorVencer).toBe(150_000)
  })

  it('separa los que ya vencieron de los que están por vencer', async () => {
    fetchMock.mockResolvedValue(
      responder({
        data: [
          pago({
            ventaId: 'vence-pronto',
            fechaExpiracion: '2026-08-21T20:00:00.000Z',
          }),
          pago({
            ventaId: 'ya-vencio',
            fechaExpiracion: '2026-08-20T20:00:00.000Z',
          }),
        ],
        total: 2,
      })
    )

    const resultado = await obtenerPagosPorVencer({ ahora: AHORA })
    expect(resultado.porVencer.map((p) => p.ventaId)).toEqual(['vence-pronto'])
    expect(resultado.vencidos.map((p) => p.ventaId)).toEqual(['ya-vencio'])
  })

  it('deja fuera de la alerta lo que vence más allá de la ventana', async () => {
    fetchMock.mockResolvedValue(
      responder({
        data: [pago({ fechaExpiracion: '2026-09-15T20:00:00.000Z' })],
        total: 1,
      })
    )

    const resultado = await obtenerPagosPorVencer({
      ahora: AHORA,
      horasAlerta: 24,
    })
    expect(resultado.porVencer).toHaveLength(0)
    expect(resultado.vencidos).toHaveLength(0)
    expect(resultado.totalPendientes).toBe(1)
  })

  it('ignora los pagos sin fecha de vencimiento', async () => {
    // `fechaExpiracionPago` es nullable y ya causó 500 del lado del backend.
    fetchMock.mockResolvedValue(
      responder({ data: [pago({ fechaExpiracion: null })], total: 1 })
    )

    const resultado = await obtenerPagosPorVencer({ ahora: AHORA })
    expect(resultado.porVencer).toHaveLength(0)
    expect(resultado.vencidos).toHaveLength(0)
  })

  it('ordena los que vencen primero al principio', async () => {
    fetchMock.mockResolvedValue(
      responder({
        data: [
          pago({
            ventaId: 'tarde',
            fechaExpiracion: '2026-08-21T22:00:00.000Z',
          }),
          pago({
            ventaId: 'temprano',
            fechaExpiracion: '2026-08-21T14:00:00.000Z',
          }),
        ],
        total: 2,
      })
    )

    const resultado = await obtenerPagosPorVencer({ ahora: AHORA })
    expect(resultado.porVencer.map((p) => p.ventaId)).toEqual([
      'temprano',
      'tarde',
    ])
  })

  it('usa valores de reserva cuando faltan datos anidados', async () => {
    fetchMock.mockResolvedValue(
      responder({
        data: [{ ventaId: 'v1', fechaExpiracion: '2026-08-21T20:00:00.000Z' }],
        total: 1,
      })
    )

    const [pagoNormalizado] = (await obtenerPagosPorVencer({ ahora: AHORA }))
      .porVencer
    expect(pagoNormalizado.empresa).toBe('N/A')
    expect(pagoNormalizado.cliente).toBe('Sin datos')
    expect(pagoNormalizado.importeTotal).toBe(0)
  })
})

describe('obtenerConectividadEmpresas', () => {
  const AHORA = new Date('2026-08-21T12:00:00.000Z')

  function empresasResponden(items: Record<string, unknown>[]) {
    // `/empresas` sí usa el envelope, y pagina con la clave `items`.
    fetchMock.mockResolvedValue(
      responder({
        success: true,
        statusCode: 200,
        message: 'Empresas obtenidas exitosamente',
        data: {
          items,
          total: items.length,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      })
    )
  }

  it('marca como "sin-url" a las empresas sin web server configurado', async () => {
    empresasResponden([
      { id: 'e1', nombre: 'Sin URL', url: '', activo: false },
      { id: 'e2', nombre: 'Sólo espacios', url: '   ', activo: true },
    ])

    const resultado = await obtenerConectividadEmpresas({ ahora: AHORA })
    expect(resultado.sinUrl).toBe(2)
    expect(resultado.empresas.every((e) => e.situacion === 'sin-url')).toBe(
      true
    )
  })

  it('NO usa `activo` para decidir la situación', async () => {
    // `activo` lo escriben el cron (cada 3 minutos, en las dos direcciones) y
    // los operadores desde el CRUD. No distingue "el web server está caído" de
    // "alguien la deshabilitó", así que no puede sostener una alerta de salud.
    empresasResponden([
      {
        id: 'e1',
        nombre: 'Desactivada a mano pero sincronizando',
        url: 'http://empresa.example/ws.asmx',
        activo: false,
        ultimaSincronizacionSoap: '2026-08-21T11:00:00.000Z',
      },
    ])

    const resultado = await obtenerConectividadEmpresas({ ahora: AHORA })
    expect(resultado.empresas[0].situacion).toBe('ok')
    expect(resultado.empresas[0].activo).toBe(false)
    expect(resultado.sinUrl).toBe(0)
  })

  it('marca "desactualizada" a la que no sincroniza hace más de 24 horas', async () => {
    empresasResponden([
      {
        id: 'e1',
        nombre: 'Atrasada',
        url: 'http://empresa.example/ws.asmx',
        activo: true,
        ultimaSincronizacionSoap: '2026-08-19T12:00:00.000Z',
      },
    ])

    const resultado = await obtenerConectividadEmpresas({ ahora: AHORA })
    expect(resultado.empresas[0].situacion).toBe('desactualizada')
    expect(resultado.desactualizadas).toBe(1)
  })

  it('distingue "nunca sincronizó" de "sincronizó hace mucho"', async () => {
    empresasResponden([
      {
        id: 'e1',
        nombre: 'Nunca',
        url: 'http://empresa.example/ws.asmx',
        activo: true,
        ultimaSincronizacionSoap: null,
      },
    ])

    const resultado = await obtenerConectividadEmpresas({ ahora: AHORA })
    expect(resultado.empresas[0].situacion).toBe('sin-sincronizar')
    expect(resultado.empresas[0].horasSinSincronizar).toBeNull()
  })

  it('normaliza el porcentaje de comisión, que llega como string', async () => {
    empresasResponden([
      {
        id: 'e1',
        nombre: 'Con comisión',
        url: 'http://empresa.example/ws.asmx',
        activo: true,
        porcentajeVentas: '2.50',
        ultimaSincronizacionSoap: '2026-08-21T11:00:00.000Z',
      },
    ])

    const resultado = await obtenerConectividadEmpresas({ ahora: AHORA })
    expect(resultado.total).toBe(1)
    expect(resultado.empresas[0].situacion).toBe('ok')
  })
})
