import { ProveedorDeConsultas, respuestaJson } from '@/test/utils'
import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  useConectividadEmpresas,
  usePagosPorVencer,
  useVentasSinBoleto,
} from './use-alertas'

/**
 * Los hooks de alertas, con la red mockeada.
 *
 * Se mockea `useAuth` en vez de montar el `AuthProvider` real porque ese
 * provider arranca el refresh automático de tokens: temporizadores y peticiones
 * que no tienen nada que ver con lo que se está probando y que harían los tests
 * lentos e intermitentes.
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

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  localStorage.setItem('accessToken', 'token-de-prueba')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const envoltorio = ProveedorDeConsultas

describe('useVentasSinBoleto', () => {
  it('entrega las ventas cobradas sin boleto emitido', async () => {
    fetchMock.mockResolvedValue(
      respuestaJson({
        data: [
          {
            id: 'v1',
            numeroTransaccion: 'TX-001',
            empresaNombre: 'Canindeyú',
            fechaVenta: '2026-08-20T10:00:00.000Z',
            fechaViaje: '2026-08-25',
            metodoPago: 'BANCARD',
            importeTotal: 100000,
            serviceChargeMontoTotal: 5000,
            comisionTotal: 10000,
            totalBoletos: 0,
            datosContacto: {},
          },
        ],
        total: 1,
        resumenFiltros: {},
      })
    )

    const { result } = renderHook(() => useVentasSinBoleto(), {
      wrapper: envoltorio,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.cantidad).toBe(1)
    expect(result.current.data?.montoAfectado).toBe(105_000)
  })

  it('expone el mensaje real del backend cuando falla', async () => {
    // "Something went wrong" no le sirve a nadie: no dice si reintentar, si
    // avisar, o si el problema es de permisos.
    fetchMock.mockResolvedValue(
      respuestaJson(
        {
          success: false,
          statusCode: 403,
          message:
            'No tienes los permisos necesarios (roles insuficientes) para realizar esta acción.',
        },
        403
      )
    )

    const { result } = renderHook(() => useVentasSinBoleto(), {
      wrapper: envoltorio,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toContain(
      'No tienes los permisos necesarios'
    )
  })

  it('acota la consulta al período cuando se le pasa uno', async () => {
    fetchMock.mockResolvedValue(
      respuestaJson({ data: [], total: 0, resumenFiltros: {} })
    )

    const periodo = {
      desde: new Date(2026, 7, 1, 0, 0, 0),
      hasta: new Date(2026, 7, 21, 23, 59, 59, 999),
    }

    const { result } = renderHook(() => useVentasSinBoleto(periodo), {
      wrapper: envoltorio,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toContain('fechaVentaDesde=')
    expect(url).toContain('fechaVentaHasta=')
  })
})

describe('usePagosPorVencer', () => {
  it('separa vencidos de por vencer', async () => {
    const dentroDeSeisHoras = new Date(Date.now() + 6 * 60 * 60 * 1000)
    const haceUnDia = new Date(Date.now() - 24 * 60 * 60 * 1000)

    fetchMock.mockResolvedValue(
      respuestaJson({
        data: [
          {
            ventaId: 'por-vencer',
            numeroTransaccion: 'TX-100',
            metodoPago: 'TRANSFERENCIA',
            importeTotal: '150000.00',
            fechaExpiracion: dentroDeSeisHoras.toISOString(),
            empresa: { nombre: 'La Ovetense' },
            ruta: { origen: 'Asunción', destino: 'Encarnación' },
            cliente: { nombre: 'Juan Pérez' },
            tiempoRestante: '6 hora(s)',
          },
          {
            ventaId: 'vencido',
            numeroTransaccion: 'TX-101',
            metodoPago: 'WHATSAPP',
            importeTotal: '90000.00',
            fechaExpiracion: haceUnDia.toISOString(),
            empresa: { nombre: 'San Luis' },
            ruta: { origen: 'Asunción', destino: 'Ciudad del Este' },
            cliente: { nombre: 'Ana Duarte' },
            tiempoRestante: 'Expirado',
          },
        ],
        total: 2,
      })
    )

    const { result } = renderHook(() => usePagosPorVencer(), {
      wrapper: envoltorio,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.porVencer.map((p) => p.ventaId)).toEqual([
      'por-vencer',
    ])
    expect(result.current.data?.vencidos.map((p) => p.ventaId)).toEqual([
      'vencido',
    ])
    expect(result.current.data?.montoPorVencer).toBe(150_000)
  })
})

describe('useConectividadEmpresas', () => {
  it('cuenta las empresas sin web server configurado', async () => {
    fetchMock.mockResolvedValue(
      respuestaJson({
        success: true,
        statusCode: 200,
        message: 'Empresas obtenidas exitosamente',
        data: {
          items: [
            { id: 'e1', nombre: 'Sin URL', url: null, activo: false },
            {
              id: 'e2',
              nombre: 'La Santaniana',
              url: 'http://lasantaniana.example/ws.asmx',
              activo: true,
              ultimaSincronizacionSoap: new Date().toISOString(),
            },
          ],
          total: 2,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      })
    )

    const { result } = renderHook(() => useConectividadEmpresas(), {
      wrapper: envoltorio,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.sinUrl).toBe(1)
    expect(result.current.data?.total).toBe(2)
  })

  it('desenvuelve el envelope de /empresas', async () => {
    // A diferencia de `/api/admin/ventas/*`, este endpoint sí usa el sobre y
    // pagina con la clave `items`, no `data`.
    fetchMock.mockResolvedValue(
      respuestaJson({
        success: true,
        statusCode: 200,
        message: 'ok',
        data: { items: [], total: 0, page: 1, limit: 100, totalPages: 0 },
      })
    )

    const { result } = renderHook(() => useConectividadEmpresas(), {
      wrapper: envoltorio,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.empresas).toEqual([])
  })
})
