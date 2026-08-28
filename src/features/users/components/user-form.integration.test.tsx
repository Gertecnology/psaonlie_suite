import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UserForm } from './user-form'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useNavigate: () => vi.fn(),
}))

vi.mock('@/components/layout/page-layout', () => ({
  PageLayout: ({
    title,
    actions,
    children,
  }: {
    title: string
    actions?: React.ReactNode
    children: React.ReactNode
  }) => (
    <div>
      <h1>{title}</h1>
      {actions}
      {children}
    </div>
  ),
}))

const traerUsuario = vi.fn()
const traerRoles = vi.fn()

vi.mock('../hooks/use-users', () => ({
  useUser: (id: string) => traerUsuario(id),
  useRoles: () => traerRoles(),
  useCreateUser: () => ({ mutate: vi.fn(), isPending: false }),
  useUpdateUser: () => ({ mutate: vi.fn(), isPending: false }),
  useResetUserPassword: () => ({ mutate: vi.fn(), isPending: false }),
}))

const SIN_CONSULTAR = {
  data: undefined,
  isLoading: false,
  error: null,
}

/**
 * La pantalla que edita un usuario.
 *
 * Lo que se prueba acá es lo que la rompió en producción: `GET /api/usuarios/:id`
 * no existía, el 404 no llegaba a la pantalla, y el formulario se dibujaba en
 * blanco. Guardar desde ahí escribe ese vacío encima de lo que la persona tenía.
 */
describe('el formulario de usuario (integración)', () => {
  const montar = (userId?: string) => {
    const cliente = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    return render(
      <QueryClientProvider client={cliente}>
        <UserForm userId={userId} />
      </QueryClientProvider>
    )
  }

  beforeEach(() => {
    traerUsuario.mockReset()
    traerRoles.mockReturnValue({ data: [], isLoading: false })
  })

  it('avisa cuando el servidor rechaza la consulta', () => {
    traerUsuario.mockReturnValue({
      ...SIN_CONSULTAR,
      error: new Error('Cannot GET /api/usuarios/u-1'),
    })

    montar('u-1')

    expect(screen.getByText('No se pudo cargar el usuario')).toBeInTheDocument()
    expect(screen.getByText('Cannot GET /api/usuarios/u-1')).toBeInTheDocument()
  })

  /**
   * El caso que pasó: la consulta termina, no hay error a la vista, y tampoco
   * hay usuario. Sin esto la pantalla dibujaba los campos vacíos como si fueran
   * los datos.
   */
  it('no dibuja el formulario cuando el usuario no llegó', () => {
    traerUsuario.mockReturnValue(SIN_CONSULTAR)

    montar('u-1')

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByLabelText('Correo')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Guardar' })
    ).not.toBeInTheDocument()
  })

  it('dibuja el formulario cuando el usuario sí llegó', () => {
    traerUsuario.mockReturnValue({
      ...SIN_CONSULTAR,
      data: {
        id: 'u-1',
        email: 'ana@gertecnology.com',
        firstName: 'Ana',
        lastName: 'Gómez',
        isActive: true,
        isVerified: false,
        roles: [{ id: 'rol-1', name: 'vendedor' }],
      },
    })

    montar('u-1')

    expect(screen.getByLabelText('Correo')).toHaveValue('ana@gertecnology.com')
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana')
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument()
  })

  /** Al crear no hay nada que traer, así que el formulario sale igual. */
  it('el alta no espera ningún registro', () => {
    traerUsuario.mockReturnValue(SIN_CONSULTAR)

    montar()

    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
