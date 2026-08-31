import { describe, expect, it } from 'vitest'
import type { Asiento } from '../models/sales.model'
import {
  BORDES_POR_CALIDAD,
  bordeDeLaCalidad,
  leerCalidades,
  nombrarCalidad,
} from './las-calidades-del-servicio'

/**
 * Las calidades de un colectivo.
 *
 * El plano mostraba todas las butacas iguales aunque el vehículo mezclara
 * calidades, así que quien vendía anunciaba un precio y la butaca costaba
 * otro.
 */

const butaca = (numero: string, calidad: string, precio: number): Asiento =>
  ({ numero, calidad, precio, disponible: true, piso: 1 }) as Asiento

describe('leer las calidades de un servicio', () => {
  it('cuenta las butacas de cada una', () => {
    const calidades = leerCalidades([
      butaca('01', 'Común', 80000),
      butaca('02', 'Común', 80000),
      butaca('41', 'Semi Cama', 96000),
    ])

    expect(calidades).toEqual([
      { calidad: 'Común', precio: 80000, butacas: 2 },
      { calidad: 'Semi Cama', precio: 96000, butacas: 1 },
    ])
  })

  it('ordena de la más barata a la más cara', () => {
    const calidades = leerCalidades([
      butaca('41', 'Semi Cama', 96000),
      butaca('01', 'Común', 80000),
    ])

    expect(calidades.map((c) => c.calidad)).toEqual(['Común', 'Semi Cama'])
  })

  it('descarta el -1, que no es un precio', () => {
    // La transportista manda -1 en las butacas que no están a la venta.
    const calidades = leerCalidades([
      butaca('01', 'Común', 80000),
      butaca('99', 'Servicio', -1),
    ])

    expect(calidades).toHaveLength(1)
    expect(calidades[0].calidad).toBe('Común')
  })

  it('la calidad vacía tiene nombre igual', () => {
    expect(leerCalidades([butaca('01', '', 80000)])[0].calidad).toBe(
      'Sin especificar'
    )
  })
})

describe('el borde con que se dibuja cada calidad', () => {
  it('con una sola calidad, ninguna butaca se adorna', () => {
    const calidades = leerCalidades([butaca('01', 'Común', 80000)])

    expect(bordeDeLaCalidad('Común', calidades)).toBe(BORDES_POR_CALIDAD[0])
  })

  it('con dos, la más cara se distingue por la forma del borde', () => {
    const calidades = leerCalidades([
      butaca('01', 'Común', 80000),
      butaca('41', 'Semi Cama', 96000),
    ])

    expect(bordeDeLaCalidad('Común', calidades)).toBe(BORDES_POR_CALIDAD[0])
    expect(bordeDeLaCalidad('Semi Cama', calidades)).toBe(BORDES_POR_CALIDAD[1])
  })

  it('una calidad que no está en la lista cae al borde de base', () => {
    // Las butacas de precio -1 no aparecen en las calidades, y aun así hay
    // que dibujarlas.
    const calidades = leerCalidades([
      butaca('01', 'Común', 80000),
      butaca('41', 'Semi Cama', 96000),
    ])

    expect(bordeDeLaCalidad('Servicio', calidades)).toBe(BORDES_POR_CALIDAD[0])
  })
})

describe('el nombre de una calidad', () => {
  it('lo que viene gritado se escribe en tono normal', () => {
    // Las transportistas mandan el nombre en mayúsculas, a veces con letras
    // repetidas para rellenar un campo de ancho fijo.
    expect(nombrarCalidad('SEMI CAMA')).toBe('Semi Cama')
    expect(nombrarCalidad('CAAAAAMAAAAA')).toBe('Caaaaamaaaaa')
  })

  it('un nombre ya bien escrito se respeta', () => {
    expect(nombrarCalidad('Semi Cama')).toBe('Semi Cama')
  })

  it('sin nombre, lo dice', () => {
    expect(nombrarCalidad('  ')).toBe('Sin especificar')
  })
})
