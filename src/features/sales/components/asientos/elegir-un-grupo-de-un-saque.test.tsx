import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockearApi } from '@/test/api-mock'
import { datosConServicioElegido } from '@/test/fixtures-venta'
import { renderVenta } from '@/test/render-venta'
import type { Asiento } from '../../models/sales.model'
import { RoundTripSeatSelectionPage } from './round-trip-seat-selection-page'

/**
 * Elegir un grupo de un saque.
 *
 * Con dieciocho pasajeros, buscar dieciocho libres seguidas mirando el plano y
 * tocarlas una por una es la parte lenta de la venta —y donde se elige mal una
 * butaca. Hay dos atajos: pedir cuántas se necesitan y que las busque juntas,
 * y ⇧+clic para llevarse un rango entero.
 *
 * Estos casos son sobre la PANTALLA: se usan los atajos y se mira qué queda
 * elegido, que es lo que ve quien vende.
 */

const butaca = (
  numero: string,
  fila: number,
  columna: string,
  disponible = true
): Asiento => ({
  numero,
  disponible,
  precio: 80000,
  tipo: 'VENTANA',
  piso: 1,
  calidad: 'Común',
  fila,
  columna,
})

const conButacas = (asientos: Asiento[]) => ({
  asientos,
  totalDisponibles: asientos.filter((a) => a.disponible).length,
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
})

/** Tres filas de cuatro, con el pasillo al medio. */
const DOCE = [
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
]

const abrirElPlano = (asientos: Asiento[] = DOCE) => {
  mockearApi([
    { url: 'consultar-asientos', status: 200, body: conButacas(asientos) },
  ])

  renderVenta(<RoundTripSeatSelectionPage tripType='ida' />, {
    datosIniciales: datosConServicioElegido(),
    pasoInicial: 'ida-seats',
  })
}

const laButaca = (numero: string) =>
  screen.findByRole('button', { name: new RegExp(`^Butaca ${numero},`) })

/** Las butacas que quedaron elegidas, leídas del plano. */
const elegidas = () =>
  screen
    .getAllByRole('button', { pressed: true })
    .map((boton) => boton.textContent?.trim())

describe('elegir un grupo de un saque', () => {
  it('pide cinco juntas y quedan elegidas cinco', async () => {
    const usuario = userEvent.setup()
    abrirElPlano()

    await usuario.clear(
      await screen.findByLabelText(/cuántas butacas necesito/i)
    )
    await usuario.type(
      screen.getByLabelText(/cuántas butacas necesito/i),
      '5'
    )
    await usuario.click(screen.getByRole('button', { name: /buscar 5 juntas/i }))

    expect(elegidas()).toEqual(['01', '02', '03', '04', '05'])
  })

  it('salta la ocupada y arranca la corrida después', async () => {
    const usuario = userEvent.setup()
    abrirElPlano(
      DOCE.map((asiento) =>
        asiento.numero === '03' ? { ...asiento, disponible: false } : asiento
      )
    )

    await usuario.clear(
      await screen.findByLabelText(/cuántas butacas necesito/i)
    )
    await usuario.type(screen.getByLabelText(/cuántas butacas necesito/i), '4')
    await usuario.click(screen.getByRole('button', { name: /buscar 4 juntas/i }))

    expect(elegidas()).toEqual(['04', '05', '06', '07'])
  })

  it('si no hay tantas juntas, no elige nada', async () => {
    const usuario = userEvent.setup()
    abrirElPlano()

    await usuario.clear(
      await screen.findByLabelText(/cuántas butacas necesito/i)
    )
    await usuario.type(screen.getByLabelText(/cuántas butacas necesito/i), '13')
    await usuario.click(
      screen.getByRole('button', { name: /buscar 13 juntas/i })
    )

    // Elegir doce cuando se pidieron trece sería vender un grupo partido sin
    // decirlo.
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
  })

  it('⇧+clic lleva todo el rango entre las dos tocadas', async () => {
    const usuario = userEvent.setup()
    abrirElPlano()

    await usuario.click(await laButaca('02'))
    await usuario.keyboard('{Shift>}')
    await usuario.click(await laButaca('06'))
    await usuario.keyboard('{/Shift}')

    expect(elegidas()).toEqual(['02', '03', '04', '05', '06'])
  })

  it('el rango saltea las ocupadas en vez de cortarse', async () => {
    const usuario = userEvent.setup()
    abrirElPlano(
      DOCE.map((asiento) =>
        asiento.numero === '04' ? { ...asiento, disponible: false } : asiento
      )
    )

    await usuario.click(await laButaca('02'))
    await usuario.keyboard('{Shift>}')
    await usuario.click(await laButaca('06'))
    await usuario.keyboard('{/Shift}')

    expect(elegidas()).toEqual(['02', '03', '05', '06'])
  })

  it('«Vaciar» deja el plano limpio', async () => {
    const usuario = userEvent.setup()
    abrirElPlano()

    await usuario.click(await laButaca('01'))
    await usuario.click(await laButaca('02'))
    expect(elegidas()).toHaveLength(2)

    await usuario.click(screen.getByRole('button', { name: /^vaciar$/i }))

    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0)
  })

  it('la ✕ del panel saca esa butaca del plano', async () => {
    const usuario = userEvent.setup()
    abrirElPlano()

    await usuario.click(await laButaca('01'))
    await usuario.click(await laButaca('02'))

    await usuario.click(
      screen.getByRole('button', { name: /sacar la butaca 01/i })
    )

    expect(elegidas()).toEqual(['02'])
  })
})
