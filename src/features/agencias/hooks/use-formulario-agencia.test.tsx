import * as React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The rule this hook exists to keep: **a background refetch must not touch what
 * the user is typing.**
 *
 * The drawer this replaced had the agency object in its effect's dependencies,
 * and that object is new on every refetch — so any background refresh called
 * `form.reset()` and wiped the form mid-sentence. It is the kind of defect that
 * never shows up in a click-through and ruins a real day of work, so it gets a
 * test that reproduces it exactly: same record, new object identity.
 */
const consultaAgencia = vi.fn()
const crearMutate = vi.fn()
const actualizarMutate = vi.fn()
const actualizarLogoMutate = vi.fn()
const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

vi.mock('./use-agencias', () => ({
  useAgencia: (id: string | undefined, habilitada = true) =>
    consultaAgencia(id, habilitada),
}))

vi.mock('./use-crear-agencia', () => ({
  useCrearAgencia: () => ({ mutate: crearMutate, isPending: false }),
}))
vi.mock('./use-actualizar-agencia', () => ({
  useActualizarAgencia: () => ({ mutate: actualizarMutate, isPending: false }),
}))
vi.mock('./use-actualizar-logo-agencia', () => ({
  useActualizarLogoAgencia: () => ({
    mutate: actualizarLogoMutate,
    isPending: false,
  }),
}))

const { useFormularioAgencia } = await import('./use-formulario-agencia')

const EMPRESA = {
  id: 'empresa-1',
  nombre: 'La Ovetense',
  usuario: 'trx',
  agenciaPrincipal: 'TRX',
  descripcion: 'Transporte',
  url: 'http://ejemplo.com/ws.asmx',
  activo: true,
  padreId: null,
  porcentajeVentas: '10.00',
  imageUrl: null,
}

function sinDatos() {
  return { data: undefined, isLoading: false, error: null }
}

function envoltorio({ children }: { children: React.ReactNode }) {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  )
}

describe('useFormularioAgencia', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consultaAgencia.mockReturnValue(sinDatos())
  })

  describe('el formulario no se pisa solo', () => {
    it('un refetch del MISMO registro no borra lo que se está escribiendo', async () => {
      // El objeto es nuevo en cada refetch aunque el registro sea el mismo: es
      // exactamente la condición que disparaba el reset.
      consultaAgencia.mockReturnValue({
        data: { ...EMPRESA },
        isLoading: false,
        error: null,
      })

      const { result, rerender } = renderHook(
        () => useFormularioAgencia('empresa-1'),
        { wrapper: envoltorio },
      )

      await waitFor(() =>
        expect(result.current.form.getValues('nombre')).toBe('La Ovetense'),
      )

      act(() => {
        result.current.form.setValue('nombre', 'La Ovetense S.A. — editando')
      })

      // Llega el refetch: otro objeto, mismos datos.
      consultaAgencia.mockReturnValue({
        data: { ...EMPRESA },
        isLoading: false,
        error: null,
      })
      rerender()

      expect(result.current.form.getValues('nombre')).toBe(
        'La Ovetense S.A. — editando',
      )
    })

    it('sí carga el registro la primera vez que llega', async () => {
      const { result, rerender } = renderHook(
        () => useFormularioAgencia('empresa-1'),
        { wrapper: envoltorio },
      )

      expect(result.current.form.getValues('nombre')).toBe('')

      consultaAgencia.mockReturnValue({
        data: EMPRESA,
        isLoading: false,
        error: null,
      })
      rerender()

      await waitFor(() =>
        expect(result.current.form.getValues('nombre')).toBe('La Ovetense'),
      )
      expect(result.current.form.getValues('url')).toBe(
        'http://ejemplo.com/ws.asmx',
      )
    })

    it('nunca precarga la contraseña', async () => {
      // La API no la devuelve; mostrar algo en ese campo sería mentir, y
      // guardarlo la sobrescribiría con basura.
      consultaAgencia.mockReturnValue({
        data: EMPRESA,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useFormularioAgencia('empresa-1'), {
        wrapper: envoltorio,
      })

      await waitFor(() =>
        expect(result.current.form.getValues('nombre')).toBe('La Ovetense'),
      )
      expect(result.current.form.getValues('password')).toBe('')
    })
  })

  describe('validación del logo', () => {
    it('rechaza un archivo que no es imagen antes de guardar', () => {
      const { result } = renderHook(() => useFormularioAgencia(), {
        wrapper: envoltorio,
      })

      act(() => {
        result.current.elegirLogo(
          new File(['x'], 'contrato.pdf', { type: 'application/pdf' }),
        )
      })

      expect(result.current.errorLogo).toMatch(/imagen/i)
      expect(result.current.form.getValues('profileImage')).toBeUndefined()
    })

    it('rechaza una imagen demasiado grande', () => {
      const { result } = renderHook(() => useFormularioAgencia(), {
        wrapper: envoltorio,
      })

      const grande = new File([new ArrayBuffer(3 * 1024 * 1024)], 'logo.png', {
        type: 'image/png',
      })

      act(() => result.current.elegirLogo(grande))

      expect(result.current.errorLogo).toMatch(/2 MB/)
    })
  })

  describe('al guardar', () => {
    it('una empresa nueva se crea y recién ahí se vuelve al listado', async () => {
      const { result } = renderHook(() => useFormularioAgencia(), {
        wrapper: envoltorio,
      })

      act(() => {
        result.current.form.setValue('nombre', 'Nueva Empresa')
        result.current.form.setValue('password', 'secreto123')
      })

      await act(async () => {
        await result.current.guardar()
      })

      expect(crearMutate).toHaveBeenCalledTimes(1)
      // La navegación va en el onSuccess: si falla, el formulario se queda con
      // todo lo cargado en vez de descartarlo.
      expect(navigate).not.toHaveBeenCalled()
      expect(crearMutate.mock.calls[0][1]).toHaveProperty('onSuccess')
    })

    it('no manda nada si no cambió nada', async () => {
      consultaAgencia.mockReturnValue({
        data: EMPRESA,
        isLoading: false,
        error: null,
      })

      const { result } = renderHook(() => useFormularioAgencia('empresa-1'), {
        wrapper: envoltorio,
      })

      await waitFor(() =>
        expect(result.current.form.getValues('nombre')).toBe('La Ovetense'),
      )

      await act(async () => {
        await result.current.guardar()
      })

      expect(actualizarMutate).not.toHaveBeenCalled()
      expect(actualizarLogoMutate).not.toHaveBeenCalled()
      expect(navigate).toHaveBeenCalledWith({ to: '/agencias' })
    })

    it('una contraseña corta no deja crear', async () => {
      const { result } = renderHook(() => useFormularioAgencia(), {
        wrapper: envoltorio,
      })

      act(() => {
        result.current.form.setValue('nombre', 'Nueva')
        result.current.form.setValue('password', '123')
      })

      await act(async () => {
        await result.current.guardar()
      })

      expect(crearMutate).not.toHaveBeenCalled()
    })

    it('sin nombre tampoco', async () => {
      const { result } = renderHook(() => useFormularioAgencia(), {
        wrapper: envoltorio,
      })

      act(() => result.current.form.setValue('password', 'secreto123'))

      await act(async () => {
        await result.current.guardar()
      })

      expect(crearMutate).not.toHaveBeenCalled()
    })
  })

  describe('la comisión heredada', () => {
    it('se pide al padre en vez de mostrar la propia de la hija', async () => {
      // La hija que hereda tiene su porcentaje en 0. Mostrar ese 0 al lado de
      // una etiqueta "Heredada" es el número equivocado en el único campo que
      // decide plata.
      const hija = {
        ...EMPRESA,
        id: 'hija-1',
        padreId: 'empresa-1',
        heredaComision: true,
        porcentajeVentas: '0.00',
      }

      consultaAgencia.mockImplementation((id: string | undefined) =>
        id === 'hija-1'
          ? { data: hija, isLoading: false, error: null }
          : { data: { ...EMPRESA, porcentajeVentas: '12.50' }, isLoading: false, error: null },
      )

      const { result } = renderHook(() => useFormularioAgencia('hija-1'), {
        wrapper: envoltorio,
      })

      await waitFor(() => expect(result.current.esHija).toBe(true))
      expect(result.current.heredaComision).toBe(true)
      expect(result.current.comisionHeredada).toBe('12.50')
    })

    it('no consulta al padre si la agencia no hereda', () => {
      consultaAgencia.mockReturnValue({
        data: { ...EMPRESA, padreId: 'empresa-1', heredaComision: false },
        isLoading: false,
        error: null,
      })

      renderHook(() => useFormularioAgencia('hija-1'), { wrapper: envoltorio })

      // La segunda llamada es la del padre: tiene que venir deshabilitada.
      const llamadaAlPadre = consultaAgencia.mock.calls.find(
        (llamada) => llamada[1] === false,
      )
      expect(llamadaAlPadre).toBeDefined()
    })
  })
})
