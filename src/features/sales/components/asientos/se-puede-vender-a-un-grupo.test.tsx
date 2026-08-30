import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockearApi } from '@/test/api-mock'
import { datosConServicioElegido } from '@/test/fixtures-venta'
import { renderVenta } from '@/test/render-venta'
import type { Asiento } from '../../models/sales.model'
import { RoundTripSeatSelectionPage } from './round-trip-seat-selection-page'

/**
 * Se puede vender a un grupo.
 *
 * El tope eran dos butacas por tramo. Una familia de cuatro necesitaba dos
 * ventas, con dos facturas y dos cobros; una delegación de dieciocho, nueve.
 * El backend nunca tuvo ese límite —sólo valida que no se mande cero—, así que
 * era una restricción inventada por la pantalla.
 *
 * Estos casos son sobre la PANTALLA: se tocan butacas y se mira qué queda
 * elegido y qué dice el botón, que es lo que ve quien vende.
 */

const butaca = (numero: string, fila: number, columna: string): Asiento => ({
  numero,
  disponible: true,
  precio: 80000,
  tipo: 'VENTANA',
  piso: 1,
  calidad: 'Común',
  fila,
  columna,
})

/** Doce butacas repartidas en tres filas de cuatro, como un colectivo. */
const DOCE_BUTACAS = {
  asientos: [
    butaca('01', 1, 'A'),
    butaca('02', 1, 'B'),
    butaca('03', 1, 'C'),
    butaca('04', 1, 'D'),
    butaca('05', 2, 'A'),
    butaca('06', 2, 'B'),
    butaca('07', 2, 'C'),
    butaca('08', 2, 'D'),
    butaca('09', 3, 'A'),
    butaca('10', 3, 'B'),
    butaca('11', 3, 'C'),
    butaca('12', 3, 'D'),
  ],
  totalDisponibles: 12,
  configuracionBus: {
    filas: 3,
    columnas: 4,
    pisos: 1,
    distribuciones: [{ piso: 1, esquema: '2-2' }],
  },
  servicioInfo: {
    empresa: 'Empresa Sol',
    calidadA: 'CO',
    calidadB: '',
    calidadDescripcionA: 'Común',
    calidadDescripcionB: '',
    tarifaA: 80000,
    tarifaB: 0,
    tarifaAMn: 80000,
    tarifaBMn: 0,
    parados: 0,
    paradosVendidos: 0,
  },
}

const elegir = async (
  usuario: ReturnType<typeof userEvent.setup>,
  numero: string,
) => {
  const butacaEnPantalla = await screen.findByRole('button', {
    name: new RegExp(`^Butaca ${numero},`),
  })
  await usuario.click(butacaEnPantalla)
}

const abrirElPlano = () => {
  mockearApi([
    { url: 'consultar-asientos', status: 200, body: DOCE_BUTACAS },
  ])

  renderVenta(<RoundTripSeatSelectionPage tripType='ida' />, {
    datosIniciales: datosConServicioElegido(),
    pasoInicial: 'ida-seats',
  })
}

describe('vender a un grupo', () => {
  it('se pueden elegir más de dos butacas', async () => {
    const usuario = userEvent.setup()
    abrirElPlano()

    await elegir(usuario, '01')
    await elegir(usuario, '02')
    await elegir(usuario, '03')
    await elegir(usuario, '04')
    await elegir(usuario, '05')

    // Con el tope de 2, de la tercera en adelante no pasaba nada.
    expect(
      await screen.findByRole('button', { name: /^Reservar 5 butacas$/i }),
    ).toBeInTheDocument()
  })

  it('el botón dice cuántas, en singular y en plural', async () => {
    const usuario = userEvent.setup()
    abrirElPlano()

    await elegir(usuario, '01')
    expect(
      await screen.findByRole('button', { name: /^Reservar 1 butaca$/i }),
    ).toBeInTheDocument()

    await elegir(usuario, '02')
    expect(
      await screen.findByRole('button', { name: /^Reservar 2 butacas$/i }),
    ).toBeInTheDocument()
  })

  it('tocar de nuevo una butaca la saca', async () => {
    const usuario = userEvent.setup()
    abrirElPlano()

    await elegir(usuario, '01')
    await elegir(usuario, '02')
    await elegir(usuario, '03')
    await elegir(usuario, '02')

    expect(
      await screen.findByRole('button', { name: /^Reservar 2 butacas$/i }),
    ).toBeInTheDocument()
  })

  it('a partir de diez avisa antes de bloquear', async () => {
    const usuario = userEvent.setup()
    abrirElPlano()

    for (const numero of [
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
    ]) {
      await elegir(usuario, numero)
    }

    // Con nueve todavía no interrumpe: no es un tope, es un accidente que se
    // quiere evitar.
    expect(screen.queryByText(/Vas a reservar/i)).not.toBeInTheDocument()

    await elegir(usuario, '10')

    expect(
      await screen.findByText(/Vas a reservar 10 butacas/i),
    ).toBeInTheDocument()
  })
})
