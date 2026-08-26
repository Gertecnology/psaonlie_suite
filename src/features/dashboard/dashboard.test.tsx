import { renderEnRuta } from '@/test/router'
import { contieneDinero, respuestaJson } from '@/test/utils'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Dashboard from './index'

/**
 * Prueba de humo del panel completo.
 *
 * El `.env` del proyecto apunta a producción, así que la app no se puede
 * levantar para mirarla. Esto es lo más cerca que se puede estar de abrir la
 * pantalla: monta el árbol entero con la red mockeada y verifica que las cinco
 * secciones aparezcan y que los números salgan del desglose correcto.
 */
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    accessToken: 'token-de-prueba',
    user: { nombre: 'Operador' },
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

// El layout arrastra notificaciones y sockets, que no tienen nada que ver con
// lo que se prueba acá y abrirían conexiones reales.
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
    ventasCanceladas: 0,
    ventasExpiradas: 0,
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
    {
      metodoPago: 'TRANSFERENCIA',
      cantidad: 3,
      monto: '100000.00',
      porcentaje: 12.5,
    },
  ],
  porAgencia: [
    {
      agenciaId: 'e1',
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

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes('/api/admin/ventas/estadisticas')) {
      return Promise.resolve(respuestaJson(ESTADISTICAS))
    }
    if (url.includes('/api/admin/ventas/pagos-pendientes')) {
      return Promise.resolve(respuestaJson({ data: [], total: 0 }))
    }
    if (url.includes('/api/admin/ventas/lista')) {
      return Promise.resolve(
        respuestaJson({ data: [], total: 0, resumenFiltros: {} })
      )
    }
    if (url.includes('/agencias')) {
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

describe('Panel de control', () => {
  it('monta las cinco secciones sin romperse', async () => {
    renderEnRuta(Dashboard)

    await waitFor(() =>
      expect(screen.getByText('Cobrado al cliente')).toBeInTheDocument()
    )

    expect(
      screen.getByRole('region', { name: 'Alertas operativas' })
    ).toBeInTheDocument()
    expect(screen.getByText('Tendencia de ventas')).toBeInTheDocument()
    expect(screen.getByText('Métodos de pago')).toBeInTheDocument()
    expect(screen.getByText('Por empresa')).toBeInTheDocument()
    expect(screen.getByText('Por ruta')).toBeInTheDocument()
    expect(screen.getByText('Últimas ventas')).toBeInTheDocument()
  })

  it('normaliza los importes que el backend manda como string', async () => {
    // 800.000 de pasaje + 40.000 de cargo. Sin normalizar, el `+` sobre dos
    // strings daría "800000.0040000.00".
    renderEnRuta(Dashboard)

    await waitFor(() =>
      expect(
        screen.getAllByText(contieneDinero('Gs. 840.000')).length
      ).toBeGreaterThan(0)
    )
  })

  it('lee el período de la URL', async () => {
    renderEnRuta(Dashboard, { busqueda: '?preset=hoy' })

    await waitFor(() => expect(screen.getByText('Hoy')).toBeInTheDocument())
  })

  it('respeta un rango a medida puesto en la URL', async () => {
    renderEnRuta(Dashboard, {
      busqueda: '?preset=personalizado&desde=2026-08-01&hasta=2026-08-15',
    })

    await waitFor(() =>
      expect(
        screen.getAllByText(/01\/08\/2026 – 15\/08\/2026/).length
      ).toBeGreaterThan(0)
    )
  })

  it('pide las estadísticas del período actual y del anterior', async () => {
    // Dos consultas, no una: el `comparacion` del backend informa 0% cuando el
    // período anterior no tuvo ventas, que es indistinguible de "no varió".
    renderEnRuta(Dashboard)

    await waitFor(() =>
      expect(screen.getByText('Cobrado al cliente')).toBeInTheDocument()
    )

    const llamadasEstadisticas = fetchMock.mock.calls.filter((llamada) =>
      String(llamada[0]).includes('/api/admin/ventas/estadisticas')
    )
    expect(llamadasEstadisticas.length).toBe(2)
  })
})
