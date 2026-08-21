import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoundTripSeatSelectionPage } from './round-trip-seat-selection-page'
import { mockearApi } from '@/test/api-mock'
import { renderVenta } from '@/test/render-venta'
import {
  RESPUESTA_ASIENTOS,
  datosConServicioElegido,
} from '@/test/fixtures-venta'

const BLOQUEO_FALLIDO = {
  exitoso: false,
  codigoReferencia: '',
  nroConexion: '',
  tiempoExpiracion: '2026-09-01T08:00:00.000Z',
  asientosBloqueados: [],
  asientosNoDisponibles: ['05'],
  mensaje: 'Ningún asiento está disponible para bloqueo',
}

const BLOQUEO_PARCIAL = {
  exitoso: true,
  codigoReferencia: 'REF-PARCIAL',
  nroConexion: '9',
  tiempoExpiracion: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  asientosBloqueados: ['05'],
  asientosNoDisponibles: ['06'],
  mensaje: '1 asientos bloqueados exitosamente',
}

const BLOQUEO_OK = {
  exitoso: true,
  codigoReferencia: 'REF-OK',
  nroConexion: '9',
  tiempoExpiracion: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  asientosBloqueados: ['05'],
  asientosNoDisponibles: [],
  mensaje: '1 asientos bloqueados exitosamente por 30 minutos',
}

async function elegirAsiento(usuario: ReturnType<typeof userEvent.setup>, numero: string) {
  const asiento = await screen.findByRole('button', {
    name: new RegExp(`^${numero}$`),
  })
  await usuario.click(asiento)
}

describe('RoundTripSeatSelectionPage — bloqueo de asientos', () => {
  it('NO reporta éxito cuando el backend responde 201 con exitoso: false', async () => {
    // Es el caso que dejaba avanzar al checkout con asientos sin reservar.
    const api = mockearApi([
      { url: 'consultar-asientos', status: 200, body: RESPUESTA_ASIENTOS },
      { url: 'bloquear-asientos', status: 201, body: BLOQUEO_FALLIDO },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripSeatSelectionPage tripType="ida" />, {
      datosIniciales: datosConServicioElegido(),
      pasoInicial: 'ida-seats',
    })

    await elegirAsiento(usuario, '5')
    await usuario.click(
      screen.getByRole('button', { name: /Reservar asientos/i }),
    )

    // El error se muestra en pantalla, no se traga.
    expect(
      await screen.findByText(/Ningún asiento está disponible para bloqueo/i),
    ).toBeInTheDocument()

    // Y no aparece ningún indicio de reserva conseguida.
    expect(screen.queryByText(/Asientos Reservados/i)).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Continuar al Checkout/i }),
    ).not.toBeInTheDocument()
    expect(api.llamadasA('bloquear-asientos')).toBe(1)
  })

  it('NO da por bueno un bloqueo parcial y libera la reserva incompleta', async () => {
    const api = mockearApi([
      { url: 'consultar-asientos', status: 200, body: RESPUESTA_ASIENTOS },
      { url: 'bloquear-asientos', status: 201, body: BLOQUEO_PARCIAL },
      {
        url: 'liberar-bloqueo',
        status: 200,
        body: { success: true, message: 'Bloqueo liberado' },
      },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripSeatSelectionPage tripType="ida" />, {
      datosIniciales: datosConServicioElegido(),
      pasoInicial: 'ida-seats',
    })

    await elegirAsiento(usuario, '5')
    await elegirAsiento(usuario, '6')
    await usuario.click(
      screen.getByRole('button', { name: /Reservar asientos/i }),
    )

    expect(
      await screen.findByText(/Solo se pudieron bloquear 1 de 2 asientos/i),
    ).toBeInTheDocument()

    await waitFor(() => expect(api.llamadasA('liberar-bloqueo')).toBe(1))

    expect(
      screen.queryByRole('button', { name: /Continuar al Checkout/i }),
    ).not.toBeInTheDocument()
  })

  it('avanza sólo cuando la empresa reservó todos los asientos pedidos', async () => {
    mockearApi([
      { url: 'consultar-asientos', status: 200, body: RESPUESTA_ASIENTOS },
      { url: 'bloquear-asientos', status: 201, body: BLOQUEO_OK },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripSeatSelectionPage tripType="ida" />, {
      datosIniciales: datosConServicioElegido(),
      pasoInicial: 'ida-seats',
    })

    await elegirAsiento(usuario, '5')
    await usuario.click(
      screen.getByRole('button', { name: /Reservar asientos/i }),
    )

    expect(
      await screen.findByRole('button', { name: /Continuar al Checkout/i }),
    ).toBeInTheDocument()
  })

  it('no manda dos bloqueos si el operador hace doble click', async () => {
    const api = mockearApi([
      { url: 'consultar-asientos', status: 200, body: RESPUESTA_ASIENTOS },
      { url: 'bloquear-asientos', status: 201, body: BLOQUEO_OK },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripSeatSelectionPage tripType="ida" />, {
      datosIniciales: datosConServicioElegido(),
      pasoInicial: 'ida-seats',
    })

    await elegirAsiento(usuario, '5')
    const boton = screen.getByRole('button', { name: /Reservar asientos/i })

    await Promise.all([usuario.click(boton), usuario.click(boton)])

    await screen.findByRole('button', { name: /Continuar al Checkout/i })
    expect(api.llamadasA('bloquear-asientos')).toBe(1)
  })

  it('muestra el desglose con el cargo por servicio antes de reservar', async () => {
    mockearApi([
      { url: 'consultar-asientos', status: 200, body: RESPUESTA_ASIENTOS },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripSeatSelectionPage tripType="ida" />, {
      datosIniciales: datosConServicioElegido(),
      pasoInicial: 'ida-seats',
    })

    await elegirAsiento(usuario, '5')

    // Pasaje 150.000 + 10% de cargo = 165.000
    expect(await screen.findByText(/Cargo por servicio \(10%\)/)).toBeInTheDocument()
    expect(screen.getByText(/165\.000/)).toBeInTheDocument()
  })
})
