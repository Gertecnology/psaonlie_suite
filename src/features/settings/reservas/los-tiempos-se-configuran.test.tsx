import { describe, expect, it } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockearApi } from '@/test/api-mock'
import { ReservasPage } from './reservas-page'

/**
 * Los tiempos de reserva se configuran desde el panel.
 *
 * Hasta ahora esta pantalla no existía: los valores estaban en la base y
 * ajustarlos requería entrar a mano.
 */

const CONFIGURACION = {
  tiempos: {
    margenEmisionMinutos: 3,
    renovacionesMaximas: 2,
    inactividadMinutos: 10,
  },
  empresas: [
    {
      id: 'e1',
      nombre: 'EPA',
      bloqueoButacasMinutos: 10,
      ventanaPagoMinutos: 7,
      ventanaTotalMinutos: 30,
    },
    {
      id: 'e2',
      nombre: 'Rysa',
      bloqueoButacasMinutos: 15,
      ventanaPagoMinutos: 12,
      ventanaTotalMinutos: 45,
    },
  ],
}

const abrir = (respuestas?: Array<{ body: unknown }>) => {
  const api = mockearApi([
    { url: 'tiempos-de-reserva', body: CONFIGURACION, respuestas },
  ])

  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <ReservasPage />
    </QueryClientProvider>
  )

  return api
}

describe('los tiempos de reserva se configuran', () => {
  it('muestra los tres que decidimos nosotros', async () => {
    abrir()

    expect(
      await screen.findByLabelText(/margen para emitir/i)
    ).toHaveValue(3)
    expect(screen.getByLabelText(/volver a pedir la butaca/i)).toHaveValue(2)
    expect(screen.getByLabelText(/dejar de renovar/i)).toHaveValue(10)
  })

  it('el bloqueo de cada empresa se consulta, no se edita', async () => {
    abrir()

    // Ponerlo editable invita a subirlo pensando que se gana tiempo, y lo
    // único que se gana es que nuestro reloj mienta.
    expect(await screen.findByText('EPA')).toBeInTheDocument()
    expect(screen.getByText('Rysa')).toBeInTheDocument()
    expect(screen.queryByLabelText(/bloqueo/i)).not.toBeInTheDocument()
  })

  it('calcula en vivo lo que le queda al vendedor', async () => {
    const usuario = userEvent.setup()
    abrir()

    // Evita que alguien ponga margen 9 sobre bloqueo 10 y deje a los
    // vendedores con un minuto para cobrar.
    const margen = await screen.findByLabelText(/margen para emitir/i)
    await usuario.clear(margen)
    await usuario.type(margen, '9')

    expect(await screen.findByText('1 minuto')).toBeInTheDocument()
  })

  it('sin cambios, no hay nada que guardar', async () => {
    abrir()

    expect(await screen.findByRole('button', { name: /guardar/i })).toBeDisabled()
  })

  it('guarda y muestra lo que quedó, no lo que se pidió', async () => {
    // El margen puede recortarse contra el bloqueo de alguna empresa.
    const usuario = userEvent.setup()
    const api = abrir([
      { body: CONFIGURACION },
      {
        body: {
          ...CONFIGURACION,
          tiempos: { ...CONFIGURACION.tiempos, inactividadMinutos: 15 },
        },
      },
    ])

    const inactividad = await screen.findByLabelText(/dejar de renovar/i)
    await usuario.clear(inactividad)
    await usuario.type(inactividad, '15')
    await usuario.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => expect(api.llamadasA('tiempos-de-reserva')).toBe(2))
    expect(screen.getByLabelText(/dejar de renovar/i)).toHaveValue(15)
  })

  it('cancelar vuelve a lo guardado', async () => {
    const usuario = userEvent.setup()
    abrir()

    const inactividad = await screen.findByLabelText(/dejar de renovar/i)
    await usuario.clear(inactividad)
    await usuario.type(inactividad, '40')

    await usuario.click(screen.getByRole('button', { name: /cancelar/i }))

    expect(screen.getByLabelText(/dejar de renovar/i)).toHaveValue(10)
  })
})
