import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetchRaw } from '@/utils/api-client'
import { useClienteConEstadisticas } from './use-clients'

vi.mock('@/utils/api-client', () => ({ apiFetchRaw: vi.fn() }))

const pedido = vi.mocked(apiFetchRaw)

const conEmail = (email: string, totalVentas: number) => ({
  cliente: {
    id: `id-de-${email}`,
    email,
    nombre: 'Ana',
    apellido: 'Gómez',
    nombreCompleto: 'Ana Gómez',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  estadisticasVentas: {
    totalVentas,
    ventasPagadas: totalVentas,
    ventasPendientes: 0,
    ventasCanceladas: 0,
    ventasExpiradas: 0,
    ventasFallidas: 0,
    montoTotalPagado: 0,
    montoTotalPendiente: 0,
  },
})

const montar = (email: string) => {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return renderHook(() => useClienteConEstadisticas(email), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
    ),
  })
}

/**
 * Los totales de compras de un cliente.
 *
 * `GET /api/clientes/:email` devuelve la persona sola, así que la ficha los
 * saca del listado filtrado por email. Ese filtro es por coincidencia parcial:
 * de ahí que lo que se prueba sea justamente que no se quede con el primero que
 * llegue.
 */
describe('el cliente con sus estadísticas', () => {
  beforeEach(() => {
    pedido.mockReset()
  })

  it('se queda con la coincidencia exacta y no con la primera fila', async () => {
    pedido.mockResolvedValue({
      data: [
        conEmail('otra.ana@correo.com', 30),
        conEmail('ana@correo.com', 4),
      ],
      total: 2,
      page: 1,
      limit: 5,
      totalPages: 1,
      resumenGeneral: {},
    })

    const { result } = montar('ana@correo.com')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.cliente.email).toBe('ana@correo.com')
    expect(result.current.data?.estadisticasVentas.totalVentas).toBe(4)
  })

  it('no se marea con las mayúsculas ni con los espacios de la URL', async () => {
    pedido.mockResolvedValue({
      data: [conEmail('ana@correo.com', 7)],
      total: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
      resumenGeneral: {},
    })

    const { result } = montar(' Ana@Correo.com ')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.estadisticasVentas.totalVentas).toBe(7)
  })

  /**
   * Devolver `null` y no reventar: la ficha sigue mostrando el formulario, y el
   * bloque de facturación y compras avisa que no pudo cargar.
   */
  it('devuelve null cuando el listado no trae a ese cliente', async () => {
    pedido.mockResolvedValue({
      data: [conEmail('otro@correo.com', 3)],
      total: 1,
      page: 1,
      limit: 5,
      totalPages: 1,
      resumenGeneral: {},
    })

    const { result } = montar('ana@correo.com')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('no consulta si todavía no hay email', () => {
    montar('')

    expect(pedido).not.toHaveBeenCalled()
  })

  it('filtra por email en la consulta, no por término libre', async () => {
    pedido.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 0,
      resumenGeneral: {},
    })

    const { result } = montar('ana@correo.com')

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const direccion = pedido.mock.calls[0][0] as string
    expect(direccion).toContain('email=ana%40correo.com')
    expect(direccion).not.toContain('termino=')
  })
})
