import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockearApi } from '@/test/api-mock'
import { datosConPasajerosCargados } from '@/test/fixtures-venta'
import { renderVenta } from '@/test/render-venta'
import { PasajerosPage } from './pasajeros-page'

/**
 * Mientras el vendedor trabaja, la reserva se renueva.
 *
 * La regla es del usuario: «mientras esté trabajando se renueva y si no se
 * libera». Sin el latido, renovar no tiene tope y una pestaña abierta y
 * olvidada retiene butacas ajenas media hora, con una llamada al web service de
 * la transportista por cada renovación.
 */

const abrirLaPlanilla = () => {
  const api = mockearApi([
    {
      url: 'tipos-documento',
      body: [{ id: '1', codigo: 'CI', descripcion: 'Cédula' }],
    },
    {
      url: '/api/paises',
      body: [{ success: true, data: [{ Codigo: 'PY', Descripcion: 'Paraguay' }] }],
    },
    {
      url: '/estado',
      body: {
        vivo: true,
        estado: 'ACTIVO',
        segundosRestantes: 300,
        expiraEn: null,
        asientos: ['05'],
      },
    },
    { url: '/actividad', body: { registrada: true } },
  ])

  renderVenta(<PasajerosPage />, {
    datosIniciales: datosConPasajerosCargados(),
    pasoInicial: 'checkout',
  })

  return api
}

describe('mientras el vendedor trabaja, la reserva se renueva', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('sin tocar nada, no se avisa: una pestaña olvidada no es alguien vendiendo', async () => {
    const api = abrirLaPlanilla()

    await vi.advanceTimersByTimeAsync(3 * 60 * 1000)

    expect(api.llamadasA('/actividad')).toBe(0)
  })

  it('al tipear en la planilla, se avisa que sigue trabajando', async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const api = abrirLaPlanilla()

    await usuario.type(screen.getByLabelText('Nombres'), 'Ana')
    await vi.advanceTimersByTimeAsync(61 * 1000)

    expect(api.llamadasA('/actividad')).toBe(1)
  })

  it('no se avisa una vez por tecla: alcanza con uno por minuto', async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const api = abrirLaPlanilla()

    // Doce teclas no son doce llamadas al backend para decir lo mismo.
    await usuario.type(screen.getByLabelText('Nombres'), 'Ana Duarte P')
    await vi.advanceTimersByTimeAsync(61 * 1000)

    expect(api.llamadasA('/actividad')).toBe(1)
  })

  it('se sigue avisando mientras se sigue trabajando', async () => {
    const usuario = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const api = abrirLaPlanilla()

    await usuario.type(screen.getByLabelText('Nombres'), 'Ana')
    await vi.advanceTimersByTimeAsync(61 * 1000)

    await usuario.type(screen.getByLabelText('Apellidos'), 'Duarte')
    await vi.advanceTimersByTimeAsync(61 * 1000)

    expect(api.llamadasA('/actividad')).toBe(2)
  })
})
