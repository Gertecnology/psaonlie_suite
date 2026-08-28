import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/api-client', () => ({ apiFetch: vi.fn() }))

vi.mock('@/features/clients/hooks/use-client-mutations', () => ({
  useCreateClient: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/features/clients/hooks/use-tipos-documento', () => ({
  useTiposDocumentoByEmpresa: () => ({
    data: [
      { codigo: 'CB', descripcion: 'C.I. Boliviana' },
      { codigo: 'C', descripcion: 'C.I. Paraguaya' },
    ],
    isLoading: false,
  }),
}))

vi.mock('../../hooks/use-get-paises', () => ({
  useGetPaisesDisponibles: () => ({
    data: [
      { codigo: 'AF', nombre: 'Afganistán' },
      { codigo: 'PY', nombre: 'Paraguay' },
    ],
    isLoading: false,
  }),
}))

import { apiFetch } from '@/utils/api-client'
import { ClientForm } from './client-form'

/**
 * Escribir la cédula tiene que completar el formulario.
 *
 * Este es el test que faltaba. Los que había probaban el **hook** con el tipo
 * de documento ya puesto, y pasaban los seis. En la pantalla real el tipo
 * arranca vacío: el vendedor escribía la cédula, no pasaba nada, y terminaba
 * preguntándole todo al pasajero igual.
 *
 * Un test que no reproduce lo que hace una persona no prueba nada.
 */
describe('la cédula completa el formulario', () => {
  const SEBASTIAN = {
    encontrado: true,
    tipoDocumento: 'C',
    nombre: 'Sebastian',
    apellido: 'Castro',
    email: 'sncastro20@gmail.com',
    fechaNacimiento: '2000-10-10',
    telefono: '0996506234',
    nacionalidad: 'PY',
    paisResidencia: 'PY',
    sexo: 'M',
    ocupacion: 'Empresario',
  }

  const montar = () => {
    const cliente = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    return render(
      <QueryClientProvider client={cliente}>
        <ClientForm agenciaId='ag-1' passengerNumber={1} seatNumber={3} />
      </QueryClientProvider>,
    )
  }

  beforeEach(() => {
    vi.mocked(apiFetch).mockReset().mockResolvedValue(SEBASTIAN as never)
  })

  it('con SÓLO el número, sin elegir el tipo, consulta', async () => {
    // El caso real del mostrador: la persona dicta su cédula y nada más.
    montar()

    await userEvent.type(
      screen.getByPlaceholderText('Número'),
      '4969917',
    )

    await waitFor(() => expect(apiFetch).toHaveBeenCalled(), { timeout: 3000 })

    const ruta = vi.mocked(apiFetch).mock.calls[0][0] as string

    expect(ruta).toContain('numeroDocumento=4969917')
    // No se manda el tipo: no hace falta y el vendedor no lo eligió.
    expect(ruta).not.toContain('tipoDocumento')
  })

  it('y completa los campos con lo que devuelve', async () => {
    montar()

    await userEvent.type(screen.getByPlaceholderText('Número'), '4969917')

    await waitFor(
      () => expect(screen.getByPlaceholderText('Nombres')).toHaveValue('Sebastian'),
      { timeout: 3000 },
    )

    expect(screen.getByPlaceholderText('Apellidos')).toHaveValue('Castro')
  })

  it('no consulta con la cédula a medio escribir', async () => {
    montar()

    await userEvent.type(screen.getByPlaceholderText('Número'), '496')
    await new Promise((resolver) => setTimeout(resolver, 800))

    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('si el documento no está registrado, no rompe nada', async () => {
    // Es la primera compra de alguien, no un error.
    vi.mocked(apiFetch).mockResolvedValue({ encontrado: false } as never)

    montar()

    await userEvent.type(screen.getByPlaceholderText('Número'), '9999999')
    await waitFor(() => expect(apiFetch).toHaveBeenCalled(), { timeout: 3000 })

    expect(screen.getByPlaceholderText('Nombres')).toHaveValue('')
  })

  it('un fallo de red tampoco: el formulario se completa a mano', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('sin conexión'))

    montar()

    await userEvent.type(screen.getByPlaceholderText('Número'), '4969917')
    await waitFor(() => expect(apiFetch).toHaveBeenCalled(), { timeout: 3000 })

    expect(screen.getByPlaceholderText('Nombres')).toBeInTheDocument()
  })
})
