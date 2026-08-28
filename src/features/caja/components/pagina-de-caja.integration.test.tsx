import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/api-client', () => ({
  apiFetch: vi.fn(),
  apiDownload: vi.fn(),
  descargarBlob: vi.fn(),
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

/**
 * `PageLayout` cuelga del `SidebarProvider` de la aplicación entera.
 *
 * Se reemplaza por uno mínimo que pinta lo mismo —título, descripción,
 * acciones y contenido— porque lo que se prueba acá es la pantalla de caja, no
 * el armazón del panel. Montar el layout de verdad obligaría a levantar el
 * router y la barra lateral para verificar qué columnas trae una tabla.
 */
vi.mock('@/components/layout/page-layout', () => ({
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

import { apiFetch } from '@/utils/api-client'
import { PaginaDeCaja } from './pagina-de-caja'

/**
 * La pantalla de caja, de punta a punta.
 *
 * No se prueban los componentes por separado: se monta la pantalla, se responde
 * como respondería el backend, y se mira lo que ve la persona.
 *
 * Lo que cubre y los unitarios no: que la respuesta del backend realmente
 * cambie qué columnas y qué tarjetas aparecen, que abrir un modal dispare su
 * consulta y no antes, y que un filtro llegue a la petición.
 */
describe('la pantalla de caja (integración)', () => {
  /** Lo que devuelve el backend para un vendedor: sin los números del negocio. */
  const COMO_VENDEDOR = {
    resumen: { cantidadVentas: 2, montoVendido: 168000, miComision: 800 },
    items: [
      {
        ventaId: 'v-1',
        numeroTransaccion: 'TXN87593508090',
        fechaVenta: '2026-08-28T03:26:33Z',
        documentoCliente: '4969917',
        nombreCliente: 'Sebastian Castro',
        empresa: 'Expressso Paraguay',
        estadoPago: 'PAGADO',
        estadoVenta: 'CONFIRMADO',
        monto: 84000,
        boletos: 1,
        miComision: 400,
      },
    ],
    page: 1,
    limit: 25,
    total: 1,
    soloMisVentas: true,
  }

  /** Lo que devuelve para quien administra: con vendedor y con el negocio. */
  const COMO_ADMIN = {
    ...COMO_VENDEDOR,
    resumen: {
      cantidadVentas: 2,
      montoVendido: 168000,
      cargoServicio: 8000,
      comisionEmpresa: 32000,
      comisionVendedores: 800,
    },
    items: [
      {
        ...COMO_VENDEDOR.items[0],
        vendedor: 'Ana Gómez',
        cargoServicio: 4000,
        comisionEmpresa: 16000,
        porcentajeComision: 20,
      },
    ],
    soloMisVentas: false,
  }

  const montar = () => {
    const cliente = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={cliente}>
        <PaginaDeCaja />
      </QueryClientProvider>,
    )

    return userEvent.setup()
  }

  const responderCon = (listado: unknown) => {
    vi.mocked(apiFetch).mockImplementation((ruta: string) => {
      if (ruta.includes('/boletos')) {
        return Promise.resolve([
          {
            id: 'b-1',
            numeroBoleto: '150040010161',
            asiento: '013',
            pasajero: 'Sebastian Castro',
            documento: '4969917',
            origen: 'Asunción',
            destino: 'Encarnacion',
            tarifa: 80000,
            estado: 'ACTIVO',
            importeADevolver: 72000,
            plazoAnulacionHoras: 20,
            tienePdf: true,
          },
        ] as never)
      }

      return Promise.resolve(listado as never)
    })
  }

  beforeEach(() => {
    vi.mocked(apiFetch).mockReset()
  })

  describe('cuando entra un vendedor', () => {
    beforeEach(() => responderCon(COMO_VENDEDOR))

    it('el título dice que son las suyas', async () => {
      montar()

      expect(
        await screen.findByRole('heading', { name: 'Mis ventas' }),
      ).toBeInTheDocument()
    })

    it('ve su comisión y NO los números del negocio', async () => {
      montar()

      // Aparece dos veces y las dos están bien: la tarjeta de arriba y la
      // columna de la tabla.
      expect(await screen.findAllByText('Mi comisión')).toHaveLength(2)

      // `exact` importa: la tarjeta del monto lleva "Pasajes más cargo por
      // servicio" como detalle, y una coincidencia parcial la confundiría con
      // la tarjeta del negocio.
      expect(
        screen.queryByText('Cargo por servicio', { exact: true }),
      ).not.toBeInTheDocument()
      expect(screen.queryByText('Comisión de empresas')).not.toBeInTheDocument()
    })

    it('no le ofrecen filtrar por origen', async () => {
      // Todas sus ventas son de caja: el filtro no significa nada para él.
      montar()

      await screen.findByText('Mis ventas')

      expect(
        screen.queryByLabelText('Origen'),
      ).not.toBeInTheDocument()
    })
  })

  describe('cuando entra quien administra', () => {
    beforeEach(() => responderCon(COMO_ADMIN))

    it('el título dice que son todas', async () => {
      // Por rol y no por texto: "Ventas" también es la etiqueta de la tarjeta
      // que cuenta cuántas hay.
      montar()

      expect(
        await screen.findByRole('heading', { name: 'Ventas' }),
      ).toBeInTheDocument()
    })

    it('ve quién vendió y los números del negocio', async () => {
      montar()

      expect(await screen.findByText('Ana Gómez')).toBeInTheDocument()
      expect(
        screen.getByText('Cargo por servicio', { exact: true }),
      ).toBeInTheDocument()
      expect(screen.getByText('A los vendedores')).toBeInTheDocument()
    })

    it('puede separar las ventas de caja de las de la web', async () => {
      montar()

      expect(
        await screen.findByLabelText('Origen'),
      ).toBeInTheDocument()
    })
  })

  describe('los modales', () => {
    beforeEach(() => responderCon(COMO_VENDEDOR))

    it('los boletos NO se piden hasta abrir el modal', async () => {
      // Sin esto se consultarían los boletos de las veinticinco filas al
      // pintar la tabla.
      const usuario = montar()

      await screen.findByText('Sebastian Castro')

      expect(
        vi.mocked(apiFetch).mock.calls.some(([ruta]) =>
          String(ruta).includes('/boletos'),
        ),
      ).toBe(false)

      await usuario.click(screen.getByLabelText('Ver la venta TXN87593508090'))

      // Ni siquiera al abrir el modal: la pestaña que arranca es la de
      // documentos, y los boletos son otra consulta.
      expect(
        vi.mocked(apiFetch).mock.calls.some(([ruta]) =>
          String(ruta).includes('/boletos'),
        ),
      ).toBe(false)

      await usuario.click(screen.getByRole('tab', { name: 'Boletos' }))

      await waitFor(() =>
        expect(
          vi.mocked(apiFetch).mock.calls.some(([ruta]) =>
            String(ruta).includes('/boletos'),
          ),
        ).toBe(true),
      )
    })

    it('el modal muestra lo que devolvería la transportista', async () => {
      const usuario = montar()

      await screen.findByText('Sebastian Castro')
      await usuario.click(screen.getByLabelText('Ver la venta TXN87593508090'))
      await usuario.click(await screen.findByRole('tab', { name: 'Boletos' }))

      const modal = await screen.findByRole('dialog')

      expect(
        within(modal).getByText(/La transportista devuelve/),
      ).toBeInTheDocument()
      expect(within(modal).getByText(/20 h antes de la salida/)).toBeInTheDocument()
    })
  })

  describe('los filtros', () => {
    beforeEach(() => responderCon(COMO_VENDEDOR))

    it('la búsqueda llega a la petición', async () => {
      const usuario = montar()

      await screen.findByText('Sebastian Castro')
      await usuario.type(screen.getByLabelText('Buscar'), '4969917')

      // Diferida: no se consulta en cada tecla.
      await waitFor(
        () =>
          expect(
            vi.mocked(apiFetch).mock.calls.some(([ruta]) =>
              String(ruta).includes('busqueda=4969917'),
            ),
          ).toBe(true),
        { timeout: 2000 },
      )
    })
  })

  describe('cuando el backend falla', () => {
    it('muestra el error en vez de una tabla vacía', async () => {
      // Una tabla vacía se lee como "no vendiste nada hoy", que es muy distinto
      // de "no se pudo consultar".
      vi.mocked(apiFetch).mockRejectedValue(
        new Error('No se pudo cargar el listado de ventas.'),
      )

      montar()

      expect(
        await screen.findByText('No se pudo cargar el listado de ventas.'),
      ).toBeInTheDocument()
    })
  })
})
