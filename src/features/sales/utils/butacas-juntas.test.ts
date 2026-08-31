import { describe, expect, it } from 'vitest'
import type { Asiento, ConfiguracionBus } from '../models/sales.model'
import { buscarJuntas, rangoEntre } from './butacas-juntas'

/**
 * Buscar butacas juntas.
 *
 * Con dieciocho pasajeros, encontrarlas a ojo y clickear una por una es la
 * parte lenta de la venta.
 */

const butaca = (
  numero: string,
  fila: number,
  columna: string,
  disponible = true,
  piso = 1
): Asiento =>
  ({
    numero,
    fila,
    columna,
    disponible,
    piso,
    precio: 80000,
    calidad: 'Común',
    tipo: 'VENTANA',
  }) as Asiento

const BUS: ConfiguracionBus = {
  filas: 3,
  columnas: 4,
  pisos: 1,
  distribuciones: [{ piso: 1, esquema: '2-2' }],
} as ConfiguracionBus

/** Tres filas de cuatro: 01..12, con el pasillo entre la segunda y la tercera. */
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

const numeros = (asientos: Asiento[] | null) =>
  asientos?.map((asiento) => asiento.numero) ?? null

describe('buscar butacas juntas', () => {
  it('toma las primeras que estén seguidas', () => {
    expect(numeros(buscarJuntas(DOCE, 4, BUS))).toEqual(['01', '02', '03', '04'])
  })

  it('el pasillo no corta el grupo', () => {
    // 02 y 03 están a los dos lados del pasillo, y siguen siendo vecinas.
    expect(numeros(buscarJuntas(DOCE, 2, BUS))).toEqual(['01', '02'])
    expect(numeros(buscarJuntas(DOCE, 3, BUS))).toEqual(['01', '02', '03'])
  })

  it('una ocupada sí corta, y la corrida arranca de nuevo', () => {
    const conOcupada = DOCE.map((asiento) =>
      asiento.numero === '03' ? { ...asiento, disponible: false } : asiento
    )

    expect(numeros(buscarJuntas(conOcupada, 4, BUS))).toEqual([
      '04',
      '05',
      '06',
      '07',
    ])
  })

  it('sigue de una fila a la siguiente', () => {
    expect(numeros(buscarJuntas(DOCE, 6, BUS))).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
    ])
  })

  it('sin lugar para tantas, devuelve nada', () => {
    expect(buscarJuntas(DOCE, 13, BUS)).toBeNull()
  })

  it('un grupo no se reparte entre pisos', () => {
    const dosPisos = [
      butaca('01', 1, 'A'),
      butaca('02', 1, 'B'),
      butaca('41', 1, 'A', true, 2),
      butaca('42', 1, 'B', true, 2),
    ]

    expect(buscarJuntas(dosPisos, 3, { ...BUS, pisos: 2 })).toBeNull()
    expect(numeros(buscarJuntas(dosPisos, 2, { ...BUS, pisos: 2 }))).toEqual([
      '01',
      '02',
    ])
  })

  it('el -1 no es un precio: esa butaca no se ofrece', () => {
    const conServicio = DOCE.map((asiento) =>
      asiento.numero === '02' ? { ...asiento, precio: -1 } : asiento
    )

    expect(numeros(buscarJuntas(conServicio, 2, BUS))).toEqual(['03', '04'])
  })
})

describe('el rango de ⇧+clic', () => {
  it('lleva todas las de en medio', () => {
    expect(numeros(rangoEntre(DOCE, DOCE[0], DOCE[4], BUS))).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
    ])
  })

  it('funciona al revés, de atrás para adelante', () => {
    expect(numeros(rangoEntre(DOCE, DOCE[4], DOCE[0], BUS))).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
    ])
  })

  it('saltea las ocupadas en vez de cortar', () => {
    const conOcupada = DOCE.map((asiento) =>
      asiento.numero === '03' ? { ...asiento, disponible: false } : asiento
    )

    expect(
      numeros(rangoEntre(conOcupada, conOcupada[0], conOcupada[4], BUS))
    ).toEqual(['01', '02', '04', '05'])
  })

  it('un rango que cruza de piso se queda en la última tocada', () => {
    const dosPisos = [...DOCE, butaca('41', 1, 'A', true, 2)]

    expect(numeros(rangoEntre(dosPisos, dosPisos[0], dosPisos[12], BUS))).toEqual(
      ['41']
    )
  })
})
