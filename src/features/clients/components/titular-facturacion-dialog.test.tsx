import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiFetch } from '@/utils/api-client'
import { type TitularDeFacturacion } from '../services/facturacion.service'
import { TitularFacturacionDialog } from './titular-facturacion-dialog'

vi.mock('@/utils/api-client', () => ({ apiFetch: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const pedido = vi.mocked(apiFetch)

const TITULAR: TitularDeFacturacion = {
  id: 'tit-1',
  tipoDocumento: 'RUC',
  documento: '80012345-6',
  razonSocial: 'Gertecnology S.A.',
  email: 'facturas@gertecnology.com',
  direccion: null,
  telefono: null,
  esPredeterminado: false,
  estadoPadron: 'ACTIVO',
  consultadoAlPadronEn: null,
}

/**
 * Cargar y corregir un titular de facturación.
 *
 * La libreta no tenía forma de crecer desde el panel: se veía lo que el cliente
 * hubiera guardado al comprar, y nada más.
 */
describe('el diálogo de titular de facturación', () => {
  const montar = (titular?: TitularDeFacturacion | null) => {
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
          <TitularFacturacionDialog
            clienteId='cli-1'
            titular={titular ?? null}
            open
            onOpenChange={vi.fn()}
          />
        </QueryClientProvider>
      ),
    }
  }

  beforeEach(() => {
    pedido.mockReset()
    pedido.mockResolvedValue(undefined)
  })

  /**
   * Escribir una razón social a mano es donde se cuela la letra equivocada que
   * después aparece en la factura.
   */
  it('busca quién es el documento y completa la razón social', async () => {
    pedido.mockResolvedValue({
      origen: 'padron',
      razonSocial: 'Gertecnology S.A.',
      tipoDocumento: 'RUC',
      email: 'facturas@gertecnology.com',
    })

    const { usuario } = montar()

    await usuario.type(screen.getByLabelText('Documento'), '80012345-6')
    await usuario.tab()

    await waitFor(() =>
      expect(screen.getByLabelText('Razón social')).toHaveValue(
        'Gertecnology S.A.'
      )
    )
    expect(pedido).toHaveBeenCalledWith(
      '/api/clientes/cli-1/facturacion/buscar?documento=80012345-6',
      expect.anything()
    )
    expect(screen.getByText(/vienen del padrón/)).toBeInTheDocument()
  })

  it('deja cargarlo a mano cuando el padrón no lo tiene', async () => {
    pedido.mockResolvedValue({ origen: 'no-encontrado' })

    const { usuario } = montar()

    await usuario.type(screen.getByLabelText('Documento'), '99999999-9')
    await usuario.tab()

    expect(
      await screen.findByText(/No figura en el padrón/)
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Razón social')).not.toBeDisabled()
  })

  /** Que la consulta falle no puede impedir cargar el titular. */
  it('sigue andando si la consulta al padrón se cae', async () => {
    pedido.mockRejectedValue(new Error('El padrón no responde.'))

    const { usuario } = montar()

    await usuario.type(screen.getByLabelText('Documento'), '80012345-6')
    await usuario.tab()

    await waitFor(() =>
      expect(screen.queryByText(/Buscando quién es/)).not.toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: 'Guardar' })).not.toBeDisabled()
  })

  it('guarda el titular nuevo contra la libreta del cliente', async () => {
    const { usuario } = montar()

    await usuario.type(screen.getByLabelText('Documento'), '4123456')
    await usuario.type(screen.getByLabelText('Razón social'), 'Ana Gómez')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() =>
      expect(pedido).toHaveBeenCalledWith(
        '/api/clientes/cli-1/facturacion',
        expect.objectContaining({ method: 'POST' })
      )
    )

    const llamada = pedido.mock.calls.find(
      ([, opciones]) =>
        (opciones as { method?: string } | undefined)?.method === 'POST'
    )
    const enviado = JSON.parse(
      (llamada?.[1] as { body: string }).body
    ) as Record<string, unknown>
    expect(enviado.documento).toBe('4123456')
    expect(enviado.razonSocial).toBe('Ana Gómez')
  })

  it('no guarda sin razón social', async () => {
    const { usuario } = montar()

    await usuario.type(screen.getByLabelText('Documento'), '4123456')
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(
      await screen.findByText('La razón social es requerida.')
    ).toBeInTheDocument()
    expect(pedido).not.toHaveBeenCalledWith(
      '/api/clientes/cli-1/facturacion',
      expect.objectContaining({ method: 'POST' })
    )
  })

  /**
   * El documento identifica al titular: cambiarlo al corregir crearía otro en
   * vez de arreglar éste, porque el backend guarda por documento.
   */
  it('al corregir trae los datos y no deja tocar el documento', async () => {
    montar(TITULAR)

    expect(screen.getByLabelText('Razón social')).toHaveValue(
      'Gertecnology S.A.'
    )
    expect(screen.getByLabelText('Documento')).toHaveAttribute('readonly')
    expect(
      screen.getByRole('heading', { name: 'Corregir titular' })
    ).toBeInTheDocument()
  })
})
