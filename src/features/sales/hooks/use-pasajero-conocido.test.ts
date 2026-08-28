import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/api-client', () => ({ apiFetch: vi.fn() }))

import { apiFetch } from '@/utils/api-client'
import { usePasajeroConocido } from './use-pasajero-conocido'

/**
 * Precargar el pasajero desde su documento, en la caja.
 *
 * En el mostrador pesa más que en la web: cada dato que el vendedor no tiene
 * que preguntar es una persona menos en la fila.
 */
describe('la precarga del pasajero en la caja', () => {
  const SEBASTIAN = {
    encontrado: true,
    nombre: 'Sebastian',
    apellido: 'Castro',
    email: 'sncastro20@gmail.com',
    fechaNacimiento: '2000-07-14',
    telefono: '0995604231',
    nacionalidad: 'PY',
    paisResidencia: 'PY',
    sexo: 'M',
    ocupacion: 'Empresario',
  }

  beforeEach(() => {
    vi.mocked(apiFetch).mockReset().mockResolvedValue(SEBASTIAN as never)
  })

  const montar = (documento: string, onEncontrado = vi.fn()) => {
    const resultado = renderHook(() =>
      usePasajeroConocido({
        tipoDocumento: 'C',
        numeroDocumento: documento,
        onEncontrado,
      }),
    )

    return { ...resultado, onEncontrado }
  }

  it('no consulta con un documento a medio escribir', async () => {
    // Cuatro dígitos todavía se están tipeando.
    montar('496')

    await new Promise((resolver) => setTimeout(resolver, 700))

    expect(apiFetch).not.toHaveBeenCalled()
  })

  it('consulta cuando el documento está completo', async () => {
    const { onEncontrado } = montar('4969917')

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    })

    const ruta = vi.mocked(apiFetch).mock.calls[0][0] as string

    expect(ruta).toContain('pasajero-por-documento')
    expect(ruta).toContain('numeroDocumento=4969917')

    await waitFor(() =>
      expect(onEncontrado).toHaveBeenCalledWith(
        expect.objectContaining({ nombre: 'Sebastian', apellido: 'Castro' }),
      ),
    )
  })

  it('no avisa cuando el documento no está registrado', async () => {
    // Es la primera compra de alguien, no un error.
    vi.mocked(apiFetch).mockResolvedValue({ encontrado: false } as never)

    const { onEncontrado } = montar('9999999')

    await waitFor(() => expect(apiFetch).toHaveBeenCalled(), { timeout: 2000 })
    await new Promise((resolver) => setTimeout(resolver, 100))

    expect(onEncontrado).not.toHaveBeenCalled()
  })

  it('un fallo de red no rompe nada', async () => {
    // El formulario se completa a mano, como siempre.
    vi.mocked(apiFetch).mockRejectedValue(new Error('sin conexión'))

    const { onEncontrado } = montar('4969917')

    await waitFor(() => expect(apiFetch).toHaveBeenCalled(), { timeout: 2000 })
    await new Promise((resolver) => setTimeout(resolver, 100))

    expect(onEncontrado).not.toHaveBeenCalled()
  })

  it('no repite la consulta del mismo documento', async () => {
    const { rerender } = montar('4969917')

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(1), {
      timeout: 2000,
    })

    rerender()
    await new Promise((resolver) => setTimeout(resolver, 700))

    expect(apiFetch).toHaveBeenCalledTimes(1)
  })
})
