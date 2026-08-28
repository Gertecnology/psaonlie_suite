import type { FunctionComponent } from 'react'
import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderEnRuta } from '@/test/router'
import { contieneDinero, respuestaJson } from '@/test/utils'
import { esquemaFiltrosInforme } from './models/informe.model'
import { InformeAnomalias } from './components/informes/anomalias'
import { InformePorRuta } from './components/informes/por-ruta'
import { InformePorServicio } from './components/informes/por-servicio'
import { InformeSerieTemporal } from './components/informes/serie-temporal'
import { InformeVentasSinBoleto } from './components/informes/ventas-sin-boleto'

/**
 * The report screens, against the payloads the API actually returns.
 *
 * This file replaces the smoke test of the old tabbed page. That one asserted
 * that seven tabs rendered inside one route; there is no such page any more, so
 * there was nothing left to keep — but the guarantee it gave is still needed and
 * is the first thing checked here: a screen that crashes on mount crashes in
 * this test too, since the app cannot be run against the backend.
 *
 * On top of it comes the rule the whole migration exists for — **nothing is
 * fetched until Emitir is pressed** — and one assertion per screen on the
 * figure that screen is read for. The fixtures mirror the DTOs field by field,
 * so a payload that changes shape fails here rather than on someone's monitor.
 */
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    accessToken: 'token-de-prueba',
    user: null,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

vi.mock('@/components/notifications/header-notifications', () => ({
  HeaderNotifications: () => null,
}))
vi.mock('@/components/profile-dropdown', () => ({
  ProfileDropdown: () => null,
}))
vi.mock('@/components/search', () => ({ Search: () => null }))

const PERIODO = { desde: '2026-08-01', hasta: '2026-08-31', dias: 31 }

/** Mirrors `InformePorRutaDto`. */
const POR_RUTA = {
  periodo: PERIODO,
  data: [
    {
      origenNombre: 'Asunción',
      destinoNombre: 'Ciudad del Este',
      ventasLiquidables: 12,
      boletosVigentes: 15,
      pasajes: 1500000,
      cargoServicio: 75000,
      comision: 150000,
      ingresoPropio: 225000,
      tarifaPromedio: 100000,
      participacion: 62.5,
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
}

/** Mirrors `InformePorServicioDto`. */
const POR_SERVICIO = {
  periodo: PERIODO,
  data: [
    {
      servicioId: 'servicio-1',
      empresaNombre: 'Canindeyú',
      calidad: 'EJECUTIVO',
      ventasLiquidables: 4,
      boletosVigentes: 6,
      pasajes: 600000,
      cargoServicio: 30000,
      comision: 60000,
      ingresoPropio: 90000,
      primerViaje: '2026-08-03',
      ultimoViaje: '2026-08-28',
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
}

/** Mirrors `SerieTemporalDto`. Two buckets, so the footer has something to add. */
const SERIE_TEMPORAL = {
  periodo: PERIODO,
  agruparPor: 'semana',
  data: [
    {
      periodo: '2026-08-03',
      ventasTotales: 10,
      ventasLiquidables: 8,
      pagadasSinBoleto: 2,
      pasajes: 800000,
      cargoServicio: 40000,
      comision: 80000,
      cobradoAlCliente: 840000,
      netoATransferirEmpresas: 720000,
      ingresoPropio: 120000,
    },
    {
      periodo: '2026-08-10',
      ventasTotales: 5,
      ventasLiquidables: 5,
      pagadasSinBoleto: 0,
      pasajes: 500000,
      cargoServicio: 25000,
      comision: 50000,
      cobradoAlCliente: 525000,
      netoATransferirEmpresas: 450000,
      ingresoPropio: 75000,
    },
  ],
}

/** Mirrors `InformeVentasPagadasSinBoletoDto`. */
const VENTAS_SIN_BOLETO = {
  periodo: PERIODO,
  data: [
    {
      ventaId: 'venta-1',
      numeroTransaccion: 'TX-001',
      empresaNombre: 'Canindeyú',
      fechaVenta: '2026-08-02T10:00:00.000Z',
      fechaViaje: '2026-08-09',
      metodoPago: 'BANCARD',
      estadoVenta: 'PAGO_APROBADO',
      pasaje: 100000,
      cargoServicio: 5000,
      cobradoAlCliente: 105000,
      antiguedadHoras: 72,
      bancardTransactionId: 'BC-9',
      contactoEmail: 'maria@ejemplo.py',
      contactoTelefono: '0981000000',
    },
    {
      ventaId: 'venta-2',
      numeroTransaccion: 'TX-002',
      empresaNombre: 'Canindeyú',
      fechaVenta: '2026-08-30T10:00:00.000Z',
      fechaViaje: '2026-09-02',
      metodoPago: 'TRANSFERENCIA',
      estadoVenta: 'PAGO_APROBADO',
      pasaje: 100000,
      cargoServicio: 5000,
      cobradoAlCliente: 105000,
      antiguedadHoras: 2,
      bancardTransactionId: null,
      contactoEmail: null,
      contactoTelefono: null,
    },
  ],
  total: 2,
  montoTotal: 210000,
  page: 1,
  limit: 10,
  totalPages: 1,
}

/** Mirrors `InformeAnomaliasDto`. */
const ANOMALIAS = {
  periodo: PERIODO,
  data: [
    {
      tipo: 'COMISION_MAYOR_QUE_PASAJE',
      ventaId: 'venta-1',
      numeroTransaccion: 'TX-001',
      empresaNombre: 'Canindeyú',
      fechaVenta: '2026-08-02',
      estadoPago: 'PAGADO',
      pasaje: 100000,
      comision: 150000,
      comisionEsperada: 10000,
      detalle: 'La comisión supera el importe del pasaje',
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
  resumen: { COMISION_MAYOR_QUE_PASAJE: 1 },
}

/** Keyed by the API path, which is not always the browser route. */
const RESPUESTAS: Record<string, unknown> = {
  'por-ruta': POR_RUTA,
  'por-servicio': POR_SERVICIO,
  'serie-temporal': SERIE_TEMPORAL,
  'ventas-pagadas-sin-boleto': VENTAS_SIN_BOLETO,
  anomalias: ANOMALIAS,
}

const PANTALLAS: Array<[string, FunctionComponent]> = [
  ['por-ruta', InformePorRuta],
  ['por-servicio', InformePorServicio],
  ['serie-temporal', InformeSerieTemporal],
  ['ventas-sin-boleto', InformeVentasSinBoleto],
  ['anomalias', InformeAnomalias],
]

/** What a shared link carries: the period plus the Emitir mark. */
const GENERADO = '?generado=true&desde=2026-08-01&hasta=2026-08-31'

function montar(Pantalla: FunctionComponent, busqueda = '') {
  return renderEnRuta(Pantalla, {
    ruta: '/reports',
    busqueda,
    // Con el esquema del panel, Zod descartaría `generado` y la pantalla nunca
    // saldría del estado "todavía no se generó".
    esquema: esquemaFiltrosInforme,
  })
}

function urlsDeInformes(): string[] {
  return fetchMock.mock.calls
    .map(([url]) => String(url))
    .filter((url) => url.includes('/api/admin/informes/'))
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockImplementation((url: string) => {
    for (const [ruta, cuerpo] of Object.entries(RESPUESTAS)) {
      // El `?` evita que `por-ruta` atrape también a `por-ruta-cualquier-cosa`.
      if (url.includes(`/api/admin/informes/${ruta}?`)) {
        return Promise.resolve(
          respuestaJson({
            success: true,
            statusCode: 200,
            message: 'ok',
            data: cuerpo,
          }),
        )
      }
    }
    if (url.includes('/agencias')) {
      return Promise.resolve(
        respuestaJson({
          success: true,
          statusCode: 200,
          message: 'ok',
          data: { items: [], total: 0, page: 1, limit: 100, totalPages: 0 },
        }),
      )
    }
    return Promise.reject(new Error(`Ruta no mockeada: ${url}`))
  })
  vi.stubGlobal('fetch', fetchMock)
  localStorage.setItem('accessToken', 'token-de-prueba')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('nada se carga hasta apretar Emitir', () => {
  it.each(PANTALLAS)(
    'el informe "%s" se abre sin consultar nada',
    async (_ruta, Pantalla) => {
      montar(Pantalla)

      // El botón es la única señal de que la pantalla montó y está esperando.
      expect(
        await screen.findByRole('button', { name: 'Emitir' }),
      ).toBeInTheDocument()
      // La regla no es "se ve vacío": es que no salió ninguna consulta. Un
      // informe que pide los datos y los esconde igual castiga a la base.
      expect(urlsDeInformes()).toHaveLength(0)
    },
  )
})

describe('informes paginados', () => {
  it('por ruta muestra la tarifa promedio de cada par origen-destino', async () => {
    montar(InformePorRuta, GENERADO)

    expect(await screen.findByText('Tarifa promedio')).toBeInTheDocument()
    expect(
      screen.getAllByText((contenido) => contenido.includes('Ciudad del Este'))
        .length,
    ).toBeGreaterThan(0)
    // 1.500.000 de pasajes sobre 15 boletos vigentes: la tarifa es por boleto,
    // no por venta, y es el número por el que se lee este informe.
    expect(
      screen.getAllByText(contieneDinero('Gs. 100.000')).length,
    ).toBeGreaterThan(0)
  })

  it('pide el período entero, no una página', async () => {
    // El formato contable sacó la paginación: la fila de totales dice «totales
    // del período», así que la hoja tiene que traer todos los renglones. Con el
    // límite por defecto del servidor (25) ese rótulo sería falso.
    montar(InformePorRuta, GENERADO)

    await screen.findByText('Tarifa promedio')

    expect(urlsDeInformes()[0]).toContain('page=1')
    expect(urlsDeInformes()[0]).toContain('limit=200')
  })

  it('por servicio muestra el primer y el último viaje en ISO 8601', async () => {
    montar(InformePorServicio, GENERADO)

    // ISO y no dd/mm/aaaa: 08/09 es ambiguo para quien lee el informe
    // archivado sin conocer la convención local. Las dos fechas comparten
    // celda —«primero — último»—, así que se busca por el renglón.
    const celda = await screen.findByText((_, elemento) => {
      const texto = elemento?.textContent ?? ''
      return (
        elemento?.tagName === 'TD' &&
        texto.includes('2026-08-03') &&
        texto.includes('2026-08-28')
      )
    })
    expect(celda).toBeInTheDocument()
    expect(screen.getByText('EJECUTIVO')).toBeInTheDocument()
  })

  it('ventas sin boleto pega contra el endpoint de nombre largo', async () => {
    // La ruta del navegador es `ventas-sin-boleto` y el endpoint
    // `ventas-pagadas-sin-boleto`: si se usara la ruta, la API devolvería 404.
    montar(InformeVentasSinBoleto, GENERADO)

    await screen.findAllByText('Canindeyú')
    expect(urlsDeInformes()[0]).toContain(
      '/api/admin/informes/ventas-pagadas-sin-boleto?',
    )
  })

  it('ventas sin boleto mide la antigüedad en horas, no en texto relativo', async () => {
    montar(InformeVentasSinBoleto, GENERADO)

    // «hace 3 días» no dice nada en una hoja archivada: no se sabe desde
    // cuándo se cuenta. La cifra y su unidad sí, y se leen igual en papel.
    await screen.findAllByText('Canindeyú')
    expect(screen.getByText('horas')).toBeInTheDocument()
    const antiguedad = screen.getByText((_, elemento) => {
      const texto = elemento?.textContent ?? ''
      return elemento?.tagName === 'SPAN' && texto.startsWith('72 horas')
    })
    expect(antiguedad).toBeInTheDocument()
    // El monto es el del período completo, no el de la página.
    expect(
      screen.getAllByText(contieneDinero('Gs. 210.000')).length,
    ).toBeGreaterThan(0)
  })

  it('anomalías dice qué le pasa a cada venta, en la fila', async () => {
    montar(InformeAnomalias, GENERADO)

    // Una sola vez: el resumen por tipo que lo repetía arriba se sacó. El tipo
    // y su explicación viven en la fila, junto a la venta que los tiene.
    expect(
      await screen.findByText('Comisión mayor que el pasaje'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('La comisión supera el importe del pasaje'),
    ).toBeInTheDocument()
  })
})

describe('serie temporal', () => {
  it('suma el período entero en el pie porque el informe no está paginado', async () => {
    montar(InformeSerieTemporal, GENERADO)

    // 840.000 + 525.000. Se puede sumar acá y no en los paginados: `data` trae
    // todos los tramos del período, no una página de ellos.
    expect(
      (await screen.findAllByText(contieneDinero('Gs. 1.365.000'))).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(/totales del período/i)).toBeInTheDocument()
  })

  it('cada tramo se identifica por el día en que empieza', async () => {
    montar(InformeSerieTemporal, GENERADO)

    expect(await screen.findByText('2026-08-03')).toBeInTheDocument()
    expect(screen.getByText('2026-08-10')).toBeInTheDocument()
  })
})
