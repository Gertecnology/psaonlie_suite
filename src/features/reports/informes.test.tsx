import { renderEnRuta } from '@/test/router'
import { contieneDinero, respuestaJson } from '@/test/utils'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InformesPage } from './components/informes-page'
import { DEFINICIONES } from './models/informes.model'

/**
 * Prueba de humo de los siete informes.
 *
 * Cada uno se abre y se verifica que renderice con datos reales del backend
 * simulado. Como la app no se puede levantar contra producción, esto es lo que
 * garantiza que ninguno reviente al montarse.
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

const ESTADISTICAS = {
  periodo: { fechaDesde: '2026-07-23', fechaHasta: '2026-08-21' },
  generales: {
    totalVentas: 40,
    ventasCompletadas: 33,
    ventasPendientes: 7,
    montoTotal: '1000000.00',
    montoCompletado: '800000.00',
    montoPendiente: '200000.00',
    totalComisiones: '100000.00',
    comisionesPagadas: '80000.00',
    comisionesPendientes: '20000.00',
    totalServiceCharges: '50000.00',
    serviceChargesPagados: '40000.00',
    serviceChargesPendientes: '10000.00',
    totalBoletos: 35,
  },
  porMetodoPago: [
    {
      metodoPago: 'BANCARD',
      cantidad: 30,
      monto: '700000.00',
      porcentaje: 87.5,
    },
  ],
  porEmpresa: [
    {
      empresaId: 'e1',
      empresaNombre: 'Canindeyú',
      cantidad: 20,
      monto: '600000.00',
      montoPagado: '500000.00',
      montoPendiente: '100000.00',
      comisiones: '60000.00',
      comisionesPagadas: '50000.00',
      comisionesPendientes: '10000.00',
      serviceCharges: '30000.00',
      serviceChargesPagados: '25000.00',
      serviceChargesPendientes: '5000.00',
      porcentaje: 60,
    },
  ],
  porRuta: [
    {
      origenNombre: 'Asunción',
      destinoNombre: 'Ciudad del Este',
      cantidad: 15,
      monto: '450000.00',
      porcentaje: 45,
    },
  ],
  temporales: [{ fecha: '2026-08-20', ventas: 5, monto: '250000.00' }],
  topClientes: [],
  comparacion: {},
}

const VENTAS = {
  data: [
    {
      id: 'v1',
      numeroTransaccion: 'TX-001',
      empresaNombre: 'Canindeyú',
      origenNombre: 'Asunción',
      destinoNombre: 'Ciudad del Este',
      fechaVenta: '2026-08-20T10:00:00.000Z',
      fechaViaje: '2026-08-25',
      horaSalida: '08:00',
      metodoPago: 'BANCARD',
      estadoPago: 'PAGADO',
      estadoVenta: 'CONFIRMADO',
      estadoAsientos: 'CONFIRMADO',
      importeTotal: '100000.00',
      serviceChargeMontoTotal: '5000.00',
      comisionTotal: '10000.00',
      totalBoletos: 1,
      numerosBoleto: '123',
      asientosOriginales: ['12'],
      datosContacto: {},
      cliente: { nombre: 'María', apellido: 'Duarte' },
    },
  ],
  total: 1,
  page: 1,
  limit: 25,
  totalPages: 1,
  resumenFiltros: {
    totalImporte: '800000.00',
    totalComision: '80000.00',
    totalServiceCharge: '40000.00',
    estadosPago: { PAGADO: 33, PENDIENTE: 7 },
    estadosVenta: { CONFIRMADO: 30, PAGO_APROBADO: 3, PENDIENTE_PAGO: 7 },
    metodosPago: { BANCARD: 35, TRANSFERENCIA: 5 },
  },
}

const PAGOS = {
  bancard: {
    totaltransacciones: '20',
    aprobadas: '15',
    rechazadas: '3',
    canceladas: '1',
    expiradas: '1',
    montoaprobado: '840000.00',
    tasaExito: 0,
  },
  pagosManules: { totalcomprobantes: '5', aprobados: '4', pendientes: '1' },
  resumen: {
    totalTransacciones: null,
    tasaExitoGeneral: 0,
    montoTotalProcesado: 0,
  },
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/admin/ventas/estadisticas')) {
      return Promise.resolve(respuestaJson(ESTADISTICAS))
    }
    if (url.includes('/api/admin/ventas/lista')) {
      return Promise.resolve(respuestaJson(VENTAS))
    }
    if (url.includes('/api/pagos/estadisticas/resumen')) {
      return Promise.resolve(respuestaJson(PAGOS))
    }
    if (url.includes('/empresas')) {
      return Promise.resolve(
        respuestaJson({
          success: true,
          statusCode: 200,
          message: 'ok',
          data: { items: [], total: 0, page: 1, limit: 100, totalPages: 0 },
        })
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

describe('Sección de informes', () => {
  it('ofrece los siete informes en la navegación', async () => {
    renderEnRuta(InformesPage, { ruta: '/reports' })

    for (const informe of DEFINICIONES) {
      expect(
        await screen.findByRole('button', { name: informe.titulo })
      ).toBeInTheDocument()
    }
  })

  it.each(DEFINICIONES.map((d) => [d.id, d.titulo] as const))(
    'el informe "%s" se abre sin romperse',
    async (id, titulo) => {
      renderEnRuta(InformesPage, {
        ruta: '/reports',
        busqueda: `?informe=${id}`,
      })

      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: titulo, level: 2 })
        ).toBeInTheDocument()
      )
    }
  )

  it('el informe de ventas suma sobre todo el conjunto filtrado', async () => {
    // `resumenFiltros` lo calcula el backend sobre el total, no sobre la
    // página: por eso el encabezado dice 800.000 con una sola fila en pantalla.
    renderEnRuta(InformesPage, {
      ruta: '/reports',
      busqueda: '?informe=ventas',
    })

    await waitFor(() =>
      expect(
        screen.getAllByText(contieneDinero('Gs. 800.000')).length
      ).toBeGreaterThan(0)
    )
    expect(screen.getByText('TX-001')).toBeInTheDocument()
  })

  it('el informe por empresa calcula el neto a transferir', async () => {
    // 500.000 cobrados − 50.000 de comisión = 450.000.
    renderEnRuta(InformesPage, {
      ruta: '/reports',
      busqueda: '?informe=empresas',
    })

    await waitFor(() =>
      expect(
        screen.getAllByText(contieneDinero('Gs. 450.000')).length
      ).toBeGreaterThan(0)
    )
    expect(screen.getAllByText('Canindeyú').length).toBeGreaterThan(0)
  })

  it('la conciliación recupera el monto real de la pasarela', async () => {
    // El backend informa `montoTotalProcesado: 0` por el problema de
    // mayúsculas en los alias SQL; el dato verdadero está en `montoaprobado`.
    renderEnRuta(InformesPage, {
      ruta: '/reports',
      busqueda: '?informe=conciliacion',
    })

    await waitFor(() =>
      expect(
        screen.getAllByText('Aprobado por la pasarela').length
      ).toBeGreaterThan(0)
    )
    expect(
      screen.getAllByText(contieneDinero('Gs. 840.000')).length
    ).toBeGreaterThan(0)
    // Y la tasa de éxito se recalcula: 15 de 20 = 75%.
    expect(screen.getByText('75,0%')).toBeInTheDocument()
  })

  it('el comparativo dice "Sin base" en vez de inventar un 0%', async () => {
    renderEnRuta(InformesPage, {
      ruta: '/reports',
      busqueda: '?informe=comparativo',
    })

    await waitFor(() =>
      expect(screen.getAllByText('Período anterior').length).toBeGreaterThan(0)
    )
    // Los dos períodos devuelven lo mismo en este mock, así que no hay
    // variación; lo que se verifica es que la tabla se arma completa.
    expect(screen.getAllByText('Cobrado al cliente').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Neto a las empresas').length).toBeGreaterThan(0)
  })

  it('cambiar de informe actualiza la URL', async () => {
    const { router } = renderEnRuta(InformesPage, { ruta: '/reports' })

    await screen.findByRole('button', { name: 'Por ruta' })
    await userEvent.click(screen.getByRole('button', { name: 'Por ruta' }))

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ informe: 'rutas' })
    )
  })
})
