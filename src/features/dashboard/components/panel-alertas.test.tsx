import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { periodoDesdePreset } from '@/lib/periodo'
import { contieneDinero, renderConProveedores, respuestaJson } from '@/test/utils'
import { PanelAlertas } from './panel-alertas'

/**
 * El panel de alertas, con la red mockeada de punta a punta.
 *
 * Es la parte que justifica que alguien tenga esta pantalla abierta: las 33
 * ventas cobradas sin boleto que hay en producción existían desde hacía meses y
 * ninguna pantalla las mostraba.
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

const PERIODO = periodoDesdePreset('30d', new Date(2026, 7, 21, 12, 0, 0))

let fetchMock: ReturnType<typeof vi.fn>

/**
 * Enruta cada petición a su respuesta según la URL.
 *
 * Cada alerta es su propia consulta a un endpoint distinto, y eso es
 * deliberado: si el listado de empresas devuelve 500, las ventas sin boleto
 * tienen que seguir viéndose.
 */
function responderPorRuta(respuestas: {
  ventas?: unknown
  pagos?: unknown
  empresas?: unknown
  ventasStatus?: number
  empresasStatus?: number
}) {
  fetchMock.mockImplementation((url: string) => {
    if (url.includes('/api/admin/ventas/lista')) {
      return Promise.resolve(
        respuestaJson(
          respuestas.ventas ?? { data: [], total: 0, resumenFiltros: {} },
          respuestas.ventasStatus ?? 200,
        ),
      )
    }
    if (url.includes('/api/admin/ventas/pagos-pendientes')) {
      return Promise.resolve(
        respuestaJson(respuestas.pagos ?? { data: [], total: 0 }),
      )
    }
    if (url.includes('/empresas')) {
      return Promise.resolve(
        respuestaJson(
          respuestas.empresas ?? {
            success: true,
            statusCode: 200,
            message: 'ok',
            data: { items: [], total: 0, page: 1, limit: 100, totalPages: 0 },
          },
          respuestas.empresasStatus ?? 200,
        ),
      )
    }
    return Promise.reject(new Error(`Ruta no mockeada: ${url}`))
  })
}

function ventaSinBoleto(numero: string) {
  return {
    id: `id-${numero}`,
    numeroTransaccion: numero,
    empresaNombre: 'Canindeyú',
    fechaVenta: '2026-08-20T10:00:00.000Z',
    fechaViaje: '2026-08-25',
    metodoPago: 'BANCARD',
    estadoPago: 'PAGADO',
    importeTotal: 100_000,
    serviceChargeMontoTotal: 5_000,
    comisionTotal: 10_000,
    totalBoletos: 0,
    datosContacto: { nombre: 'María Duarte' },
  }
}

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  localStorage.setItem('accessToken', 'token-de-prueba')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('PanelAlertas', () => {
  it('muestra las ventas cobradas sin boleto con su monto', async () => {
    responderPorRuta({
      ventas: {
        data: [ventaSinBoleto('TX-001'), ventaSinBoleto('TX-002')],
        total: 2,
        resumenFiltros: {},
      },
    })

    renderConProveedores(<PanelAlertas periodo={PERIODO} />)

    await waitFor(() =>
      expect(screen.getByText('Ventas cobradas sin boleto')).toBeInTheDocument(),
    )

    expect(screen.getByText('2')).toBeInTheDocument()
    // Lo perdido es lo que pagó el cliente: 2 × (100.000 + 5.000).
    expect(
      screen.getAllByText(contieneDinero('Gs. 210.000')).length,
    ).toBeGreaterThan(0)
  })

  it('abre el detalle con el número de transacción de cada venta', async () => {
    // Sin el número no se puede reconciliar la venta con la empresa.
    responderPorRuta({
      ventas: {
        data: [ventaSinBoleto('TX-001')],
        total: 1,
        resumenFiltros: {},
      },
    })

    renderConProveedores(<PanelAlertas periodo={PERIODO} />)

    const boton = await screen.findByRole('button', { name: /Ver la 1 venta|Ver las 1 ventas/i })
    await userEvent.click(boton)

    expect(await screen.findByText('TX-001')).toBeInTheDocument()
    expect(screen.getByText('María Duarte')).toBeInTheDocument()
  })

  it('dice que está todo bien cuando no hay ventas sin boleto', async () => {
    responderPorRuta({
      ventas: { data: [], total: 0, resumenFiltros: {} },
    })

    renderConProveedores(<PanelAlertas periodo={PERIODO} />)

    await waitFor(() =>
      expect(
        screen.getByText(/Todas las ventas pagadas tienen su boleto emitido/i),
      ).toBeInTheDocument(),
    )
  })

  it('avisa cuando sólo pudo revisar una parte de las ventas pagadas', async () => {
    responderPorRuta({
      ventas: {
        data: [ventaSinBoleto('TX-001')],
        total: 5_000,
        resumenFiltros: {},
      },
    })

    renderConProveedores(<PanelAlertas periodo={PERIODO} />)

    await waitFor(() =>
      expect(screen.getByText(/más recientes de 5.000/i)).toBeInTheDocument(),
    )
  })

  it('cuenta las empresas sin web server configurado', async () => {
    responderPorRuta({
      empresas: {
        success: true,
        statusCode: 200,
        message: 'ok',
        data: {
          items: [
            { id: 'e1', nombre: 'Sin URL', url: null, activo: false },
            { id: 'e2', nombre: 'Tampoco', url: '', activo: false },
            {
              id: 'e3',
              nombre: 'La Santaniana',
              url: 'http://santaniana.example/ws.asmx',
              activo: true,
              ultimaSincronizacionSoap: new Date().toISOString(),
            },
          ],
          total: 3,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      },
    })

    renderConProveedores(<PanelAlertas periodo={PERIODO} />)

    await waitFor(() =>
      expect(screen.getByText('Empresas sin conexión')).toBeInTheDocument(),
    )
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    expect(
      screen.getByText(/El dato falta, no está caído/i),
    ).toBeInTheDocument()
  })

  it('un fallo en una alerta no tapa a las demás', async () => {
    // El panel viejo mostraba una sola pantalla de error para todo.
    responderPorRuta({
      empresasStatus: 500,
      empresas: {
        success: false,
        statusCode: 500,
        message: 'Error interno del servidor',
      },
      ventas: {
        data: [ventaSinBoleto('TX-001')],
        total: 1,
        resumenFiltros: {},
      },
    })

    renderConProveedores(<PanelAlertas periodo={PERIODO} />)

    await waitFor(() =>
      expect(screen.getByText('Ventas cobradas sin boleto')).toBeInTheDocument(),
    )

    // La alerta que falló muestra el mensaje real del backend, no un genérico.
    expect(
      screen.getByText(/No se pudo consultar: Error interno del servidor/i),
    ).toBeInTheDocument()
  })
})
