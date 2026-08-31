import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockearApi } from '@/test/api-mock'
import {
  VENTA_CONFIRMADA_OK,
  datosConPasajerosCargados,
} from '@/test/fixtures-venta'
import { renderVenta } from '@/test/render-venta'
import { PasajerosPage } from './pasajeros-page'
import { RoundTripCheckoutPage } from './round-trip-checkout-page'

/**
 * Cuando se soltaron las butacas.
 *
 * Antes no pasaba nada: el contador llegaba a cero en silencio y el error
 * aparecía cuando el backend rechazaba la venta, con las dieciocho filas ya
 * cargadas. El contador de la pantalla es sólo visual —el reloj de la máquina
 * puede estar corrido y la pestaña pudo estar suspendida—, así que la única
 * autoridad es el backend.
 */

const RUTAS_BASE = [
  {
    url: 'tipos-documento',
    body: [{ id: '1', codigo: 'CI', descripcion: 'Cédula' }],
  },
  {
    url: '/api/paises',
    body: [{ success: true, data: [{ Codigo: 'PY', Descripcion: 'Paraguay' }] }],
  },
]

const conLaReserva = (estado: { vivo: boolean } | 'no-existe') =>
  mockearApi([
    ...RUTAS_BASE,
    estado === 'no-existe'
      ? { url: '/estado', status: 404, body: { message: 'No hay ninguna reserva' } }
      : {
          url: '/estado',
          body: { ...estado, estado: 'ACTIVO', segundosRestantes: 300, expiraEn: null, asientos: ['05'] },
        },
    { url: 'confirmar-nueva', status: 201, body: VENTA_CONFIRMADA_OK },
    { url: '/api/clientes', status: 201, body: { cliente: { id: 'CLI-1' } } },
  ])

describe('cuando se soltaron las butacas', () => {
  it('mientras la reserva vive, no interrumpe nada', async () => {
    conLaReserva({ vivo: true })

    renderVenta(<PasajerosPage />, {
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'checkout',
    })

    await waitFor(() =>
      expect(screen.getByText('1 de 1 completos')).toBeInTheDocument()
    )
    expect(screen.queryByText(/se soltaron las butacas/i)).not.toBeInTheDocument()
  })

  it('si el backend dice que se soltó, avisa apenas se entra', async () => {
    conLaReserva({ vivo: false })

    renderVenta(<PasajerosPage />, {
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'checkout',
    })

    expect(
      await screen.findByText(/se soltaron las butacas/i)
    ).toBeInTheDocument()
  })

  it('lo primero que dice es que el trabajo no se perdió', async () => {
    conLaReserva({ vivo: false })

    renderVenta(<PasajerosPage />, {
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'checkout',
    })

    // Con 18 filas cargadas es la pregunta que quien vende se hace primero.
    expect(
      await screen.findByText(/queda[n]? guardados/i)
    ).toBeInTheDocument()
  })

  it('ofrece las tres salidas, y ninguna pierde lo cargado', async () => {
    conLaReserva({ vivo: false })

    renderVenta(<PasajerosPage />, {
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'checkout',
    })

    expect(
      await screen.findByRole('button', { name: /elegir butacas de nuevo/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /buscar otro servicio/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /descargar la lista/i })
    ).toBeInTheDocument()
  })

  it('un código que nunca existió se trata como reserva perdida', async () => {
    // Para quien vende es lo mismo: no tiene butacas.
    conLaReserva('no-existe')

    renderVenta(<PasajerosPage />, {
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'checkout',
    })

    expect(
      await screen.findByText(/se soltaron las butacas/i)
    ).toBeInTheDocument()
  })

  it('no confirma la venta contra butacas que se soltaron mientras revisaba', async () => {
    // El caso real: la reserva estaba viva al entrar y se soltó mientras el
    // vendedor completaba la facturación. Sin la verificación previa se emite
    // un boleto contra asientos que la transportista ya liberó.
    const vivo = {
      estado: 'ACTIVO',
      segundosRestantes: 300,
      expiraEn: null,
      asientos: ['05'],
    }
    const api = mockearApi([
      ...RUTAS_BASE,
      {
        url: '/estado',
        body: { ...vivo, vivo: true },
        respuestas: [
          { body: { ...vivo, vivo: true } },
          { body: { ...vivo, vivo: false } },
        ],
      },
      { url: 'confirmar-nueva', status: 201, body: VENTA_CONFIRMADA_OK },
      { url: '/api/clientes', status: 201, body: { cliente: { id: 'CLI-1' } } },
    ])
    const usuario = userEvent.setup()

    renderVenta(<RoundTripCheckoutPage />, {
      datosIniciales: datosConPasajerosCargados(),
      pasoInicial: 'resumen',
    })

    await usuario.type(screen.getByLabelText(/RUC o documento/i), '4969917-2')
    await usuario.type(
      screen.getByLabelText(/Razón social o nombre/i),
      'Sebastian Castro'
    )
    await usuario.click(screen.getByRole('radio', { name: 'Efectivo' }))
    await usuario.click(screen.getByRole('button', { name: /^Cobrar / }))

    await waitFor(() =>
      expect(screen.getByText(/se soltaron las butacas/i)).toBeInTheDocument()
    )
    expect(api.llamadasA('confirmar-nueva')).toBe(0)
  })
})
