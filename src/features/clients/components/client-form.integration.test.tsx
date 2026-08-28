import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch, apiFetchRaw } from '@/utils/api-client'
import { ClientForm } from './client-form'

vi.mock('@/utils/api-client', () => ({
  apiFetch: vi.fn(),
  apiFetchRaw: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const navegar = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => navegar,
}))

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    accessToken: 'token-de-prueba',
    user: null,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}))

/**
 * El catálogo de empresas pega contra `fetch` crudo con una URL absoluta, que
 * en jsdom sin `VITE_API_URL` ni siquiera se puede construir. Lo que se prueba
 * acá es la ficha, no de dónde salen las empresas.
 */
vi.mock('@/features/dashboard/hooks/use-agencias-list', () => ({
  useAgenciasList: () => ({ data: { data: [] }, isLoading: false }),
}))

vi.mock('@/components/layout', () => ({
  PageLayout: ({
    title,
    description,
    actions,
    children,
  }: {
    title: string
    description?: string
    actions?: React.ReactNode
    children: React.ReactNode
  }) => (
    <div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
      {actions}
      {children}
    </div>
  ),
}))

const crudo = vi.mocked(apiFetchRaw)
const conEnvoltorio = vi.mocked(apiFetch)

const CLIENTE = {
  id: 'cli-1',
  email: 'ana@correo.com',
  nombre: 'Ana',
  apellido: 'Gómez',
  nombreCompleto: 'Ana Gómez',
  fechaNacimiento: '1990-04-12T00:00:00.000Z',
  sexo: 'F',
  nacionalidad: 'Paraguaya',
  paisResidencia: 'Paraguay',
  telefono: '+595981123456',
  ocupacion: 'Profesional',
  observaciones: '',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

const LISTADO = {
  data: [
    {
      cliente: CLIENTE,
      estadisticasVentas: {
        totalVentas: 12,
        ventasPagadas: 9,
        ventasPendientes: 3,
        ventasCanceladas: 0,
        ventasExpiradas: 0,
        ventasFallidas: 0,
        montoTotalPagado: 1250000,
        montoTotalPendiente: 0,
        ultimaVenta: '2026-08-01T10:00:00Z',
      },
    },
  ],
  total: 1,
  page: 1,
  limit: 5,
  totalPages: 1,
  resumenGeneral: {},
}

/**
 * La ficha del cliente, de punta a punta.
 *
 * Lo que cubre y los unitarios no: que ver y corregir sean la misma pantalla —
 * el resumen de compras, el formulario y las pestañas montados juntos— y que el
 * alta no arrastre nada de eso, porque todavía no hay cliente del que hablar.
 */
describe('la ficha del cliente (integración)', () => {
  const montar = (email?: string) => {
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
          <ClientForm email={email} />
        </QueryClientProvider>
      ),
    }
  }

  beforeEach(() => {
    crudo.mockReset()
    conEnvoltorio.mockReset()
    navegar.mockReset()

    crudo.mockImplementation(async (url: string) => {
      if (url.includes('/admin/lista')) return LISTADO
      if (url.includes('tipos-documento')) return []
      return CLIENTE
    })

    conEnvoltorio.mockImplementation(async (url: string) => {
      if (url.includes('/facturacion')) return []
      if (url.includes('/ventas/lista')) {
        return { data: [], total: 0, page: 1, limit: 10, totalPages: 0 }
      }
      throw new Error(`Dirección no esperada: ${url}`)
    })
  })

  it('titula la ficha con el nombre guardado del cliente', async () => {
    montar('ana@correo.com')

    expect(
      await screen.findByRole('heading', { name: 'Ana Gómez' })
    ).toBeInTheDocument()
  })

  it('muestra lo que lleva comprado junto a sus datos', async () => {
    montar('ana@correo.com')

    await screen.findByRole('heading', { name: 'Ana Gómez' })

    expect(await screen.findByText('12')).toBeInTheDocument()
    expect(screen.getByText(/1\.250\.000/)).toBeInTheDocument()
    expect(screen.getByText('75% del total')).toBeInTheDocument()
  })

  /** Ver los datos y corregirlos es el mismo gesto: una sola pantalla. */
  it('trae los datos del cliente en campos editables', async () => {
    montar('ana@correo.com')

    const nombre = await screen.findByLabelText('Nombre')
    expect(nombre).toHaveValue('Ana')
    expect(nombre).not.toBeDisabled()
    expect(screen.getByLabelText('Teléfono')).toHaveValue('+595981123456')
  })

  /**
   * La fecha llega como timestamp ISO y `<input type='date'>` sólo entiende
   * `yyyy-MM-dd`: si no se recorta, el navegador vacía el campo en silencio y
   * guardar escribe ese vacío de vuelta.
   */
  it('carga la fecha de nacimiento en el formato que el campo entiende', async () => {
    montar('ana@correo.com')

    expect(await screen.findByLabelText('Fecha de nacimiento')).toHaveValue(
      '1990-04-12'
    )
  })

  it('conserva lo elegido en los desplegables al cargar el cliente', async () => {
    const { usuario } = montar('ana@correo.com')

    await waitFor(async () =>
      expect(await screen.findByLabelText('Nombre')).toHaveValue('Ana')
    )

    // El valor del desplegable no se lee del texto del disparador: hasta que se
    // abre, Radix mantiene las opciones fuera del documento.
    await usuario.click(screen.getByLabelText('Sexo'))
    expect(
      await screen.findByRole('option', { name: 'Femenino' })
    ).toHaveAttribute('data-state', 'checked')
  })

  it('deja el email de sólo lectura, porque identifica al cliente', async () => {
    montar('ana@correo.com')

    const email = await screen.findByLabelText('Email')
    expect(email).toHaveAttribute('readonly')
  })

  it('monta la libreta de facturación y las compras debajo', async () => {
    montar('ana@correo.com')

    expect(
      await screen.findByRole('tab', { name: /Datos de facturación/ })
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Compras/ })).toBeInTheDocument()
  })

  /**
   * Guardar vive en el encabezado, fuera del `<form>`, y llega hasta él por el
   * atributo `form`. Que estén atados se comprueba por los atributos: jsdom no
   * resuelve el dueño del formulario al hacer click en un botón de afuera, así
   * que el envío se dispara sobre el formulario mismo.
   */
  it('ata el botón Guardar del encabezado al formulario', async () => {
    const { container } = montar('ana@correo.com')

    await screen.findByLabelText('Nombre')

    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute(
      'form',
      'cliente-form'
    )
    expect(container.querySelector('form')).toHaveAttribute(
      'id',
      'cliente-form'
    )
  })

  it('guarda sólo los campos que el endpoint de actualización acepta', async () => {
    const { usuario, container } = montar('ana@correo.com')

    const nombre = await screen.findByLabelText('Nombre')
    // El formulario se rellena cuando llega el cliente, no al montarse: tocarlo
    // antes escribe sobre valores que el `reset` va a pisar.
    await waitFor(() => expect(nombre).toHaveValue('Ana'))

    await usuario.clear(nombre)
    await usuario.type(nombre, 'Ana María')
    fireEvent.submit(container.querySelector('form')!)

    await waitFor(() =>
      expect(crudo).toHaveBeenCalledWith(
        '/api/clientes/ana%40correo.com',
        expect.objectContaining({ method: 'PUT' })
      )
    )

    const llamada = crudo.mock.calls.find(
      ([, opciones]) =>
        (opciones as { method?: string } | undefined)?.method === 'PUT'
    )
    const enviado = JSON.parse(
      (llamada?.[1] as { body: string }).body
    ) as Record<string, unknown>

    expect(enviado.nombre).toBe('Ana María')
    expect(enviado).not.toHaveProperty('email')
    expect(enviado).not.toHaveProperty('agenciaId')
  })

  it('en el alta pide primero la empresa y no muestra compras ni facturación', () => {
    montar()

    expect(
      screen.getByText('Con qué empresa se da de alta')
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('tab', { name: /Compras/ })
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Monto pagado')).not.toBeInTheDocument()
  })

  /** Sin empresa no se sabe qué documentos se aceptan, así que el resto espera. */
  it('en el alta no deja guardar hasta que haya empresa', () => {
    montar()

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    expect(screen.getByLabelText('Nombre')).toBeDisabled()
  })

  it('avisa cuando el cliente no se pudo cargar', async () => {
    crudo.mockImplementation(async (url: string) => {
      if (url.includes('/admin/lista')) return LISTADO
      throw new Error('El cliente no existe.')
    })

    montar('ana@correo.com')

    expect(
      await screen.findByText('No se pudo cargar el cliente', undefined, {
        timeout: 8000,
      })
    ).toBeInTheDocument()
    expect(screen.getByText('El cliente no existe.')).toBeInTheDocument()
  })
})
