import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockearApi } from '@/test/api-mock'
import { renderVenta } from '@/test/render-venta'
import type { ParadaHomologada } from '../models/sales.model'
import { SalesPage } from './sales-page'

/**
 * La vuelta sólo si la piden.
 *
 * Quien vende buscaba ida y vuelta una vez, sacaba la vuelta y la vuelta
 * seguía ahí: el contexto la conservaba porque borrarla se mandaba como
 * `vuelta: undefined` y el merge trataba eso igual que no tocarla. Como la
 * pantalla arranca con la vuelta abierta si el contexto la tiene, al volver
 * del paso de butacas el campo reaparecía solo y parecía que la búsqueda la
 * incluía sin haberla pedido.
 *
 * Estos casos son sobre la PANTALLA: se mira qué controles hay y qué queda
 * después de tocarlos, que es lo que ve quien vende.
 */

const ASUNCION: ParadaHomologada = {
  id: '1',
  nombre: 'Asunción',
} as ParadaHomologada

const ENCARNACION: ParadaHomologada = {
  id: '2',
  nombre: 'Encarnación',
} as ParadaHomologada

const CON_VUELTA = {
  ida: {
    origen: ASUNCION,
    destino: ENCARNACION,
    fecha: new Date(2026, 8, 10),
  },
  vuelta: {
    origen: ENCARNACION,
    destino: ASUNCION,
    fecha: new Date(2026, 8, 15),
  },
}

const SOLO_IDA = { ida: CON_VUELTA.ida }

/**
 * La pantalla de búsqueda tal como se sale y se vuelve a ella.
 *
 * Elegir un servicio monta el paso de butacas y volver monta la búsqueda de
 * nuevo, con el contexto vivo. Ese remonte es donde la vuelta reaparecía.
 */
function BuscarQueSeVaYVuelve() {
  const [enBusqueda, setEnBusqueda] = useState(true)

  return (
    <>
      <button onClick={() => setEnBusqueda((antes) => !antes)}>
        {enBusqueda ? 'ir a butacas' : 'volver a buscar'}
      </button>
      {enBusqueda && <SalesPage />}
    </>
  )
}

const sinServicios = () =>
  mockearApi([
    { url: '/api/servicios-por-destinos', body: [] },
    { url: '/api/search-paradas-homologadas', body: [] },
  ])

describe('la vuelta sólo si la piden', () => {
  it('sin pedirla, hay un botón para agregarla y ningún campo de vuelta', () => {
    sinServicios()
    renderVenta(<SalesPage />, { datosIniciales: SOLO_IDA })

    expect(
      screen.getByRole('button', { name: /agregar vuelta/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /sacar la vuelta/i })
    ).not.toBeInTheDocument()
  })

  it('sacarla deja el botón de agregarla, no un campo vacío', async () => {
    sinServicios()
    const usuario = userEvent.setup()
    renderVenta(<SalesPage />, { datosIniciales: CON_VUELTA })

    await usuario.click(screen.getByRole('button', { name: /sacar la vuelta/i }))

    expect(
      screen.getByRole('button', { name: /agregar vuelta/i })
    ).toBeInTheDocument()
  })

  it('sacada la vuelta, buscar no la manda', async () => {
    const api = sinServicios()
    const usuario = userEvent.setup()
    renderVenta(<SalesPage />, { datosIniciales: CON_VUELTA })

    await usuario.click(screen.getByRole('button', { name: /sacar la vuelta/i }))
    await usuario.click(screen.getByRole('button', { name: /^buscar$/i }))

    await waitFor(() =>
      expect(api.llamadasA('/api/servicios-por-destinos')).toBe(1)
    )

    // Una sola consulta: la de la ida. Si la vuelta siguiera puesta habría dos,
    // o la de vuelta con origen y destino invertidos.
    const [url] = api.llamadas()[api.llamadas().length - 1]
    expect(String(url)).toContain('origenDestinoId=1')
    expect(String(url)).toContain('destinoDestinoId=2')
  })

  it('sacada la vuelta, volver a la búsqueda no la trae de nuevo', async () => {
    sinServicios()
    const usuario = userEvent.setup()
    renderVenta(<BuscarQueSeVaYVuelve />, { datosIniciales: CON_VUELTA })

    await usuario.click(screen.getByRole('button', { name: /sacar la vuelta/i }))
    await usuario.click(screen.getByRole('button', { name: /^buscar$/i }))

    await usuario.click(screen.getByRole('button', { name: /ir a butacas/i }))
    await usuario.click(screen.getByRole('button', { name: /volver a buscar/i }))

    expect(
      screen.getByRole('button', { name: /agregar vuelta/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /sacar la vuelta/i })
    ).not.toBeInTheDocument()
  })

  it('pedirla abre el campo de la fecha de vuelta', async () => {
    sinServicios()
    const usuario = userEvent.setup()
    renderVenta(<SalesPage />, { datosIniciales: SOLO_IDA })

    await usuario.click(screen.getByRole('button', { name: /agregar vuelta/i }))

    expect(
      screen.getByRole('button', { name: /sacar la vuelta/i })
    ).toBeInTheDocument()
    expect(screen.getByText('Vuelta')).toBeInTheDocument()
  })
})
