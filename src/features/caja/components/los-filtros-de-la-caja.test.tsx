import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
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

vi.mock('@/components/layout/page-layout', () => ({
  PageLayout: ({
    title,
    children,
  }: {
    title: string
    children: React.ReactNode
  }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}))

import { apiFetch } from '@/utils/api-client'
import { PaginaDeCaja } from './pagina-de-caja'

/**
 * Los filtros de la caja, desde la pantalla.
 *
 * Se monta la página entera y se mira lo que ve la persona. Probar los
 * componentes de filtro por separado diría que cada control emite su valor,
 * que es cierto y no alcanza: lo que importa es que ese valor **llegue a la
 * petición**, porque un filtro que no viaja recorta las veinticinco filas que
 * ya estaban y deja los totales contando otra cosa.
 */
describe('los filtros de la caja', () => {
  const UNA_FILA = {
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
  }

  const COMO_ADMIN = {
    resumen: {
      cantidadVentas: 137,
      montoVendido: 11508000,
      cargoServicio: 548000,
      comisionEmpresa: 2192000,
      comisionVendedores: 54800,
    },
    items: [{ ...UNA_FILA, vendedor: 'Ana Gómez', cargoServicio: 4000 }],
    page: 1,
    limit: 25,
    total: 137,
    soloMisVentas: false,
  }

  const COMO_VENDEDOR = {
    ...COMO_ADMIN,
    resumen: { cantidadVentas: 3, montoVendido: 252000, miComision: 1200 },
    items: [{ ...UNA_FILA, miComision: 400 }],
    total: 3,
    soloMisVentas: true,
  }

  const LAS_OPCIONES = {
    empresas: [
      { id: 'e-expresso', nombre: 'Expressso Paraguay' },
      { id: 'e-nsa', nombre: 'Nuestra Señora de la Asunción' },
    ],
    vendedores: [{ id: 'u-ana', nombre: 'Ana Gómez' }],
  }

  /** Las rutas pedidas, en orden. */
  const rutas = () =>
    vi.mocked(apiFetch).mock.calls.map(([ruta]) => String(ruta))

  /** Si alguna petición del listado llevó este fragmento. */
  const sePidio = (fragmento: string) =>
    rutas().some((ruta) => ruta.includes(fragmento))

  const responderCon = (listado: unknown, opciones = LAS_OPCIONES) => {
    vi.mocked(apiFetch).mockImplementation((ruta: string) => {
      if (String(ruta).includes('/caja/opciones')) {
        return Promise.resolve(opciones as never)
      }

      return Promise.resolve(listado as never)
    })
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

  /** Abre un desplegable de Radix y elige una opción por su texto. */
  const elegir = async (
    usuario: ReturnType<typeof userEvent.setup>,
    etiqueta: string,
    opcion: string,
  ) => {
    await usuario.click(await screen.findByLabelText(etiqueta))
    await usuario.click(await screen.findByRole('option', { name: opcion }))
  }

  beforeEach(() => {
    vi.mocked(apiFetch).mockReset()
  })

  describe('el período con el que abre', () => {
    it('viaja escrito, no queda implícito en el backend', async () => {
      responderCon(COMO_ADMIN)
      montar()

      // El backend acota a treinta días si no le dicen nada. Que la pantalla
      // los mande igual no es redundante: es lo que hace que el filtro se vea
      // y que nadie lea los totales creyendo que son de toda la historia.
      await waitFor(() => expect(sePidio('fechaDesde=')).toBe(true))
      expect(sePidio('fechaHasta=')).toBe(true)
    })
  })

  describe('cada filtro llega a la petición', () => {
    beforeEach(() => responderCon(COMO_ADMIN))

    it('el estado de la venta, aparte del estado del pago', async () => {
      const usuario = montar()
      await screen.findByText('Sebastian Castro')

      await elegir(usuario, 'Estado de la venta', 'ANULADO')

      await waitFor(() => expect(sePidio('estadoVenta=ANULADO')).toBe(true))
    })

    it('la empresa, por su id', async () => {
      const usuario = montar()
      await screen.findByText('Sebastian Castro')

      await elegir(usuario, 'Empresa', 'Nuestra Señora de la Asunción')

      await waitFor(() => expect(sePidio('emisorId=e-nsa')).toBe(true))
    })

    it('el vendedor, para quien administra', async () => {
      const usuario = montar()
      await screen.findByText('Sebastian Castro')

      await elegir(usuario, 'Vendedor', 'Ana Gómez')

      await waitFor(() => expect(sePidio('vendedorId=u-ana')).toBe(true))
    })

    it('el rango de monto', async () => {
      const usuario = montar()
      await screen.findByText('Sebastian Castro')

      await usuario.type(screen.getByLabelText('Monto cobrado mínimo'), '50000')

      await waitFor(() => expect(sePidio('montoMin=50000')).toBe(true))
    })

    it('un mínimo de cero también: el cero es un valor, no una ausencia', async () => {
      const usuario = montar()
      await screen.findByText('Sebastian Castro')

      await usuario.type(screen.getByLabelText('Monto cobrado mínimo'), '0')

      // Con un descarte por verdad, «desde 0» se convertiría en «sin mínimo».
      // Son consultas distintas: la primera incluye las ventas en cero.
      await waitFor(() => expect(sePidio('montoMin=0')).toBe(true))
    })
  })

  describe('al cambiar un filtro', () => {
    beforeEach(() => responderCon(COMO_ADMIN))

    it('se vuelve a la primera página', async () => {
      const usuario = montar()
      await screen.findByText('Sebastian Castro')

      await usuario.click(screen.getByLabelText('Página siguiente'))
      await waitFor(() => expect(sePidio('page=2')).toBe(true))

      await elegir(usuario, 'Estado de la venta', 'ANULADO')

      // Sin esto, quien está en la página 4 y agrega un filtro con dos
      // resultados ve una tabla vacía y concluye que no hay nada.
      await waitFor(() =>
        expect(
          rutas().some(
            (ruta) => ruta.includes('estadoVenta=ANULADO') && ruta.includes('page=1'),
          ),
        ).toBe(true),
      )
    })
  })

  describe('lo aplicado se ve', () => {
    beforeEach(() => responderCon(COMO_ADMIN))

    it('el chip de la empresa dice su nombre, no su id', async () => {
      const usuario = montar()
      await screen.findByText('Sebastian Castro')

      await elegir(usuario, 'Empresa', 'Nuestra Señora de la Asunción')

      // Un uuid en un chip no le explica a nadie por qué la tabla tiene tres
      // filas.
      expect(
        await screen.findByLabelText('Quitar el filtro Empresa'),
      ).toBeInTheDocument()
      expect(screen.queryByText('e-nsa')).not.toBeInTheDocument()
    })

    it('quitar un chip saca ese filtro y deja los otros', async () => {
      const usuario = montar()
      await screen.findByText('Sebastian Castro')

      await elegir(usuario, 'Empresa', 'Expressso Paraguay')
      await elegir(usuario, 'Estado de la venta', 'ANULADO')

      await usuario.click(
        await screen.findByLabelText('Quitar el filtro Empresa'),
      )

      await waitFor(() =>
        expect(
          rutas().some(
            (ruta) =>
              ruta.includes('estadoVenta=ANULADO') && !ruta.includes('emisorId='),
          ),
        ).toBe(true),
      )
    })

    it('limpiar vuelve al período inicial, no a "todo desde siempre"', async () => {
      const usuario = montar()
      await screen.findByText('Sebastian Castro')

      await elegir(usuario, 'Estado de la venta', 'ANULADO')
      await usuario.click(await screen.findByText('Limpiar filtros'))

      // Volver a un objeto vacío pediría la historia completa: una consulta
      // distinta y mucho más cara que la que abrió la pantalla.
      await waitFor(() =>
        expect(
          rutas().some(
            (ruta) =>
              ruta.includes('fechaDesde=') && !ruta.includes('estadoVenta='),
          ),
        ).toBe(true),
      )
    })
  })

  describe('la paginación', () => {
    beforeEach(() => responderCon(COMO_ADMIN))

    it('dice qué se está viendo, no sólo en qué página se está', async () => {
      montar()

      // «Página 1 de 6» no dice cuántas filas quedan sin mirar.
      expect(await screen.findByText('1–25 de 137')).toBeInTheDocument()
    })
  })

  describe('cuando entra un vendedor', () => {
    beforeEach(() =>
      responderCon(COMO_VENDEDOR, { empresas: LAS_OPCIONES.empresas, vendedores: [] }),
    )

    it('no le ofrecen filtrar por vendedor ni por origen', async () => {
      montar()
      await screen.findByText('Sebastian Castro')

      // No se deshabilitan: no se dibujan. Un control gris invita a preguntarse
      // qué falta para usarlo, y acá no falta nada.
      expect(screen.queryByLabelText('Vendedor')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Origen')).not.toBeInTheDocument()
    })

    it('sí filtra por empresa, estado y monto', async () => {
      montar()
      await screen.findByText('Sebastian Castro')

      expect(await screen.findByLabelText('Empresa')).toBeInTheDocument()
      expect(screen.getByLabelText('Estado del pago')).toBeInTheDocument()
      expect(screen.getByLabelText('Monto cobrado mínimo')).toBeInTheDocument()
    })
  })
})
