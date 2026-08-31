import { describe, expect, it } from 'vitest'

import type { Asiento, ConfiguracionBus } from '../models/sales.model'
import {
  armarPlanoDelPiso,
  cortesDePasillo,
  hayPosiciones,
} from './plano-del-colectivo'

/**
 * El plano se arma con la posición que manda la transportista.
 *
 * Antes se armaba con `slice(i, i + columnas)`: partía el arreglo de butacas
 * por índice. Como el backend entrega las ocupadas mezcladas con las libres y
 * los números saltan, cada butaca terminaba donde le tocó en la lista y no
 * donde va en el vehículo.
 *
 * `Fila` y `Columna` vienen del web service y el backend ya las guarda; lo que
 * faltaba era usarlas.
 */

const bus = (extra: Partial<ConfiguracionBus> = {}): ConfiguracionBus => ({
  filas: 10,
  columnas: 4,
  pisos: 1,
  ...extra,
})

const butaca = (
  numero: string,
  fila: number,
  columna: string,
  disponible = true,
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

describe('el plano del colectivo', () => {
  it('pone cada butaca en su fila y su columna', () => {
    const { filas } = armarPlanoDelPiso(
      [
        butaca('04', 1, 'D'),
        butaca('01', 1, 'A'),
        butaca('05', 2, 'A'),
        butaca('02', 1, 'B'),
      ],
      1,
      bus(),
    )

    // Dos filas, aunque llegaran desordenadas.
    expect(filas).toHaveLength(2)

    const numerosDeLaPrimera = filas[0]
      .filter((celda) => celda.tipo === 'butaca')
      .map((celda) => (celda.tipo === 'butaca' ? celda.asiento.numero : ''))

    expect(numerosDeLaPrimera).toEqual(['01', '02', '04'])
  })

  it('deja el hueco donde la fila no tiene butaca', () => {
    // La fila 2 sólo tiene la A y la D: entre medio hay hueco, no se corren
    // las de la derecha hacia la izquierda.
    const { filas } = armarPlanoDelPiso(
      [
        butaca('01', 1, 'A'),
        butaca('02', 1, 'B'),
        butaca('03', 1, 'C'),
        butaca('04', 1, 'D'),
        butaca('05', 2, 'A'),
        butaca('08', 2, 'D'),
      ],
      1,
      bus(),
    )

    const segunda = filas[1].filter((celda) => celda.tipo !== 'pasillo')

    expect(segunda.map((celda) => celda.tipo)).toEqual([
      'butaca',
      'hueco',
      'hueco',
      'butaca',
    ])
  })

  it('dibuja las ocupadas: son las que dan la forma del vehículo', () => {
    const { filas } = armarPlanoDelPiso(
      [
        butaca('01', 1, 'A'),
        butaca('02', 1, 'B', false),
        butaca('03', 1, 'C', false),
        butaca('04', 1, 'D'),
      ],
      1,
      bus(),
    )

    const butacas = filas[0].filter((celda) => celda.tipo === 'butaca')

    expect(butacas).toHaveLength(4)
    expect(
      butacas.filter(
        (celda) => celda.tipo === 'butaca' && !celda.asiento.disponible,
      ),
    ).toHaveLength(2)
  })

  it('mete el pasillo donde lo dice el esquema de la empresa', () => {
    const { filas } = armarPlanoDelPiso(
      [
        butaca('01', 1, 'A'),
        butaca('02', 1, 'B'),
        butaca('03', 1, 'C'),
        butaca('04', 1, 'D'),
      ],
      1,
      bus({ distribuciones: [{ piso: 1, esquema: '2-2' }] }),
    )

    expect(filas[0].map((celda) => celda.tipo)).toEqual([
      'butaca',
      'butaca',
      'pasillo',
      'butaca',
      'butaca',
    ])
  })

  it('un cama 1-2 lleva el pasillo después de la primera', () => {
    const { filas } = armarPlanoDelPiso(
      [butaca('01', 1, 'A'), butaca('02', 1, 'B'), butaca('03', 1, 'C')],
      1,
      bus({ columnas: 3, distribuciones: [{ piso: 1, esquema: '1-2' }] }),
    )

    expect(filas[0].map((celda) => celda.tipo)).toEqual([
      'butaca',
      'pasillo',
      'butaca',
      'butaca',
    ])
  })

  it('sin esquema, el pasillo va al medio', () => {
    expect(cortesDePasillo(undefined, 4)).toEqual([2])
    expect(cortesDePasillo('', 4)).toEqual([2])
  })

  it('una sola columna no lleva pasillo', () => {
    expect(cortesDePasillo(undefined, 1)).toEqual([])
  })

  it('el pasillo de un 1-2-1 va en dos lugares', () => {
    expect(cortesDePasillo('1-2-1', 4)).toEqual([1, 3])
  })
})

describe('cuándo hay posición para dibujar', () => {
  it('la hay si las butacas están en filas distintas', () => {
    expect(hayPosiciones([butaca('01', 1, 'A'), butaca('05', 2, 'A')])).toBe(
      true,
    )
  })

  it('no la hay si la empresa no la informa', () => {
    // El backend cae a `fila: 1` cuando el web service no la manda: todas
    // comparten fila y no hay plano posible. Dibujar uno inventado sería peor
    // que no dibujarlo.
    expect(hayPosiciones([butaca('01', 1, 'A'), butaca('05', 1, 'B')])).toBe(
      false,
    )
  })

  it('tampoco con el campo ausente', () => {
    const sinPosicion: Asiento = {
      numero: '01',
      disponible: true,
      precio: 80000,
      tipo: 'VENTANA',
      piso: 1,
      calidad: 'Común',
    }

    expect(hayPosiciones([sinPosicion, { ...sinPosicion, numero: '02' }])).toBe(
      false,
    )
  })
})
