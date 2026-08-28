import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/utils/api-client'
import {
  downloadBlobAsFile,
  downloadInvoice,
} from '@/features/dashboard/services/invoice.service'
import { ClientDetalleTabs } from './client-detalle-tabs'

vi.mock('@/utils/api-client', () => ({ apiFetch: vi.fn() }))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

/**
 * El listado de ventas no consulta hasta que hay token, así que sin esto la
 * pestaña de compras se queda vacía por una razón que no es la que se prueba.
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

vi.mock('@/features/dashboard/services/invoice.service', () => ({
  downloadInvoice: vi.fn(),
  downloadBlobAsFile: vi.fn(),
}))

const pedido = vi.mocked(apiFetch)

const TITULARES = [
  {
    id: 'tit-1',
    tipoDocumento: 'RUC',
    documento: '80012345-6',
    razonSocial: 'Gertecnology S.A.',
    email: 'facturas@gertecnology.com',
    direccion: null,
    telefono: null,
    esPredeterminado: true,
    estadoPadron: 'ACTIVO',
    consultadoAlPadronEn: '2026-08-01T00:00:00Z',
  },
  {
    id: 'tit-2',
    tipoDocumento: 'CI',
    documento: '4969917',
    razonSocial: 'Sebastián Castro',
    email: null,
    direccion: null,
    telefono: null,
    esPredeterminado: false,
    estadoPadron: 'SUSPENDIDO',
    consultadoAlPadronEn: '2026-08-01T00:00:00Z',
  },
]

const VENTAS = {
  data: [
    {
      id: 'v-1',
      numeroTransaccion: 'TXN87593508090',
      fechaViaje: '2026-09-14T10:00:00Z',
      origenNombre: 'Encarnación',
      destinoNombre: 'Asunción',
      empresaNombre: 'Expresso Paraguay',
      importeTotal: 84000,
      estadoVenta: 'CONFIRMADO',
      estadoPago: 'PAGADO',
    },
  ],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
  resumenFiltros: {},
}

/**
 * La libreta de facturación y las compras del cliente, de punta a punta.
 *
 * No se prueban los componentes por separado: se monta el bloque, se responde
 * como respondería el backend, y se mira lo que ve la persona.
 */
describe('las pestañas de la ficha del cliente (integración)', () => {
  const responderSegunLaUrl = (
    ventas: Record<string, unknown> = VENTAS,
    titulares: unknown = TITULARES
  ) => {
    pedido.mockImplementation(async (url: string) => {
      if (url.includes('/facturacion')) return titulares
      if (url.includes('/ventas/lista')) return ventas
      throw new Error(`Dirección no esperada: ${url}`)
    })
  }

  const montar = () => {
    const cliente = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    return {
      usuario: userEvent.setup(),
      ...render(
        <QueryClientProvider client={cliente}>
          <ClientDetalleTabs clienteId='cli-1' />
        </QueryClientProvider>
      ),
    }
  }

  beforeEach(() => {
    pedido.mockReset()
    vi.mocked(downloadInvoice).mockReset()
    vi.mocked(downloadBlobAsFile).mockReset()
  })

  it('muestra la libreta con el predeterminado señalado', async () => {
    responderSegunLaUrl()
    montar()

    expect(await screen.findByText('Gertecnology S.A.')).toBeInTheDocument()

    const fila = screen.getByText('Gertecnology S.A.').closest('tr')
    expect(within(fila!).getByText('Predeterminado')).toBeInTheDocument()
  })

  /**
   * Un titular suspendido factura igual, pero con un contribuyente que la DNIT
   * tiene marcado. Verlo antes de emitir es la razón de que la columna exista.
   */
  it('avisa cuando el padrón no lo tiene activo', async () => {
    responderSegunLaUrl()
    montar()

    expect(await screen.findByText(/SUSPENDIDO — revisar/)).toBeInTheDocument()
  })

  /** Predeterminar y quitar viven en el menú de la fila. */
  const abrirElMenuDe = async (
    usuario: ReturnType<typeof userEvent.setup>,
    razonSocial: string
  ) => {
    const fila = screen.getByText(razonSocial).closest('tr')
    await usuario.click(
      within(fila!).getByRole('button', { name: /Más acciones/ })
    )
    return screen.getByRole('menu')
  }

  it('no ofrece predeterminar al que ya lo es', async () => {
    responderSegunLaUrl()
    const { usuario } = montar()

    await screen.findByText('Gertecnology S.A.')

    const menuDelPredeterminado = await abrirElMenuDe(
      usuario,
      'Gertecnology S.A.'
    )
    expect(
      within(menuDelPredeterminado).queryByRole('menuitem', {
        name: /Predeterminar/,
      })
    ).not.toBeInTheDocument()
    await usuario.keyboard('{Escape}')

    const menuDelOtro = await abrirElMenuDe(usuario, 'Sebastián Castro')
    expect(
      within(menuDelOtro).getByRole('menuitem', { name: /Predeterminar/ })
    ).toBeInTheDocument()
  })

  it('ofrece agregar un titular', async () => {
    responderSegunLaUrl()
    montar()

    expect(
      await screen.findByRole('button', { name: /Agregar titular/ })
    ).toBeInTheDocument()
  })

  it('cuenta los titulares y cuál viene elegido', async () => {
    responderSegunLaUrl()
    montar()

    expect(
      await screen.findByText('2 titulares · 1 predeterminado')
    ).toBeInTheDocument()
  })

  it('marca el predeterminado contra el endpoint del titular elegido', async () => {
    responderSegunLaUrl()
    const { usuario } = montar()

    await screen.findByText('Sebastián Castro')

    const menu = await abrirElMenuDe(usuario, 'Sebastián Castro')
    await usuario.click(
      within(menu).getByRole('menuitem', { name: /Predeterminar/ })
    )

    await waitFor(() =>
      expect(pedido).toHaveBeenCalledWith(
        '/api/clientes/cli-1/facturacion/tit-2/predeterminado',
        expect.objectContaining({ method: 'POST' })
      )
    )
  })

  /** Quitar no se puede deshacer: primero pregunta. */
  it('no borra un titular hasta que se confirma', async () => {
    responderSegunLaUrl()
    const { usuario } = montar()

    await screen.findByText('Sebastián Castro')

    const menu = await abrirElMenuDe(usuario, 'Sebastián Castro')
    await usuario.click(within(menu).getByRole('menuitem', { name: /Quitar/ }))

    expect(
      await screen.findByText(/¿Quitar a Sebastián Castro de la libreta\?/)
    ).toBeInTheDocument()
    expect(pedido).not.toHaveBeenCalledWith(
      '/api/clientes/cli-1/facturacion/tit-2',
      expect.objectContaining({ method: 'DELETE' })
    )

    const dialogo = screen.getByRole('alertdialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Quitar' }))

    await waitFor(() =>
      expect(pedido).toHaveBeenCalledWith(
        '/api/clientes/cli-1/facturacion/tit-2',
        expect.objectContaining({ method: 'DELETE' })
      )
    )
  })

  it('dice qué pasa cuando el cliente no tiene datos de facturación', async () => {
    responderSegunLaUrl(VENTAS, [])
    montar()

    expect(
      await screen.findByText(/Sus compras\s+salen a consumidor final/)
    ).toBeInTheDocument()
  })

  it('pide las compras del cliente y no las de todos', async () => {
    responderSegunLaUrl()
    montar()

    await waitFor(() => {
      const direcciones = pedido.mock.calls.map(
        (llamada) => llamada[0] as string
      )
      expect(
        direcciones.some(
          (direccion) =>
            direccion.includes('/ventas/lista') &&
            direccion.includes('clienteId=cli-1')
        )
      ).toBe(true)
    })
  })

  it('lista las compras en la pestaña de compras', async () => {
    responderSegunLaUrl()
    const { usuario } = montar()

    await usuario.click(screen.getByRole('tab', { name: /Compras/ }))

    expect(
      await screen.findByText('Encarnación → Asunción')
    ).toBeInTheDocument()
    expect(screen.getByText(/84\.000/)).toBeInTheDocument()
  })

  it('descarga la factura de una compra', async () => {
    responderSegunLaUrl()
    vi.mocked(downloadInvoice).mockResolvedValue({
      data: new Blob(['pdf']),
      filename: 'factura.pdf',
    } as Awaited<ReturnType<typeof downloadInvoice>>)

    const { usuario } = montar()

    await usuario.click(screen.getByRole('tab', { name: /Compras/ }))
    await screen.findByText('Encarnación → Asunción')

    await usuario.click(screen.getByRole('button', { name: /Descargar/ }))

    await waitFor(() =>
      expect(downloadInvoice).toHaveBeenCalledWith('TXN87593508090')
    )
    expect(downloadBlobAsFile).toHaveBeenCalled()
  })

  it('no deja pasar de la última página', async () => {
    responderSegunLaUrl()
    const { usuario } = montar()

    await usuario.click(screen.getByRole('tab', { name: /Compras/ }))
    await screen.findByText('Encarnación → Asunción')

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })
})
