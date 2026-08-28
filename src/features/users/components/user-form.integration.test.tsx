import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  const ROLES = [
    { id: 'rol-admin', name: 'admin' },
    { id: 'rol-vendedor', name: 'vendedor' },
  ]

  beforeEach(() => {
    traerUsuario.mockReset()
    traerRoles.mockReturnValue({ data: ROLES, isLoading: false })
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

/**
 * Cuánto le queda al vendedor de cada venta.
 *
 * El campo estaba en la base y la venta ya lo leía, pero no había dónde
 * cargarlo: los cuatro vendedores estaban en cero, vendiendo sin cobrar nada.
 */
describe('la comisión en la ficha del usuario', () => {
  const ROLES = [
    { id: 'rol-admin', name: 'admin' },
    { id: 'rol-vendedor', name: 'vendedor' },
  ]

  const montar = (userId?: string) => {
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
          <UserForm userId={userId} />
        </QueryClientProvider>
      ),
    }
  }

  const conRol = (nombre: string, porcentaje = 0) => ({
    data: {
      id: 'u-1',
      email: 'ana@gertecnology.com',
      firstName: 'Ana',
      lastName: 'Gómez',
      isActive: true,
      isVerified: false,
      porcentajeComisionVenta: porcentaje,
      roles: ROLES.filter((rol) => rol.name === nombre),
    },
    isLoading: false,
    error: null,
  })

  beforeEach(() => {
    traerUsuario.mockReset()
    traerRoles.mockReturnValue({ data: ROLES, isLoading: false })
  })

  it('muestra la comisión de un vendedor, con lo que tiene cargado', () => {
    traerUsuario.mockReturnValue(conRol('vendedor', 5.5))

    montar('u-1')

    expect(screen.getByLabelText('Comisión por venta')).toHaveValue('5.5')
  })

  /** Un administrador no vende, así que el campo no tiene nada que hacer ahí. */
  it('no la muestra para un rol que no vende', () => {
    traerUsuario.mockReturnValue(conRol('admin'))

    montar('u-1')

    expect(
      screen.queryByLabelText('Comisión por venta')
    ).not.toBeInTheDocument()
  })

  it('aparece al elegir el rol de vendedor', async () => {
    traerUsuario.mockReturnValue(conRol('admin'))

    const { usuario } = montar('u-1')

    expect(
      screen.queryByLabelText('Comisión por venta')
    ).not.toBeInTheDocument()

    await usuario.click(screen.getByLabelText('Rol'))
    await usuario.click(await screen.findByRole('option', { name: 'vendedor' }))

    expect(
      await screen.findByLabelText('Comisión por venta')
    ).toBeInTheDocument()
  })

  it('avisa cuando el porcentaje no entra en el rango', async () => {
    traerUsuario.mockReturnValue(conRol('vendedor', 5))

    const { usuario } = montar('u-1')

    const campo = screen.getByLabelText('Comisión por venta')
    await usuario.clear(campo)
    await usuario.type(campo, '101')
    fireEvent.submit(campo.closest('form')!)

    expect(
      await screen.findByText('El porcentaje no puede pasar de 100.')
    ).toBeInTheDocument()
  })

  /** La columna es `numeric(5,2)`: un tercer decimal se perdería en silencio. */
  it('no acepta un tercer decimal', async () => {
    traerUsuario.mockReturnValue(conRol('vendedor', 5))

    const { usuario } = montar('u-1')

    const campo = screen.getByLabelText('Comisión por venta')
    await usuario.clear(campo)
    await usuario.type(campo, '5.555')
    fireEvent.submit(campo.closest('form')!)

    expect(
      await screen.findByText('El porcentaje admite hasta dos decimales.')
    ).toBeInTheDocument()
  })
})
