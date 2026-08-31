import { describe, expect, it } from 'vitest'
import {
  COLUMNAS,
  copiarHaciaAbajo,
  cuantasCompletas,
  estaCompleta,
  filaVacia,
  loQueFalta,
  type DatosDelPasajero,
} from './los-datos-del-pasajero'

/**
 * Los datos de un pasajero.
 *
 * Con dieciocho butacas son ciento noventa y ocho celdas: la pantalla tiene
 * que saber cuántas filas faltan y cuál, no sólo si el conjunto es válido.
 */

const completa = (cambios: Partial<DatosDelPasajero> = {}): DatosDelPasajero => ({
  ...filaVacia(),
  numeroDocumento: '3481220',
  nombre: 'Ana',
  apellido: 'Duarte',
  tipoDocumento: 'CI',
  nacionalidad: 'PY',
  paisResidencia: 'Paraguay',
  fechaNacimiento: '1988-03-12',
  sexo: 'F',
  ocupacion: 'Docente',
  telefono: '0981224118',
  email: 'ana.duarte@example.com',
  ...cambios,
})

describe('cuándo una fila está completa', () => {
  it('con los once obligatorios, lo está', () => {
    expect(estaCompleta(completa())).toBe(true)
    expect(loQueFalta(completa())).toEqual([])
  })

  it('las observaciones no hacen falta', () => {
    expect(estaCompleta(completa({ observaciones: '' }))).toBe(true)
  })

  it('dice exactamente qué falta', () => {
    expect(loQueFalta(completa({ apellido: '', telefono: '' }))).toEqual([
      'apellido',
      'telefono',
    ])
  })

  it('un espacio no es un dato', () => {
    expect(loQueFalta(completa({ nombre: '   ' }))).toEqual(['nombre'])
  })

  it('un email sin arroba no alcanza', () => {
    expect(estaCompleta(completa({ email: 'ana.duarte' }))).toBe(false)
  })

  it('cuenta cuántas de la planilla están listas', () => {
    expect(
      cuantasCompletas([completa(), completa({ nombre: '' }), completa()])
    ).toBe(2)
  })
})

describe('copiar hacia abajo', () => {
  it('lleva el valor a las filas siguientes', () => {
    const filas = [completa({ apellido: 'Duarte' }), filaVacia(), filaVacia()]

    const despues = copiarHaciaAbajo(filas, 0, 'apellido')

    expect(despues[1].apellido).toBe('Duarte')
    expect(despues[2].apellido).toBe('Duarte')
  })

  it('no pisa lo que ya está cargado', () => {
    // Copiar sobre el trabajo hecho convierte un atajo en pérdida de trabajo.
    const filas = [
      completa({ apellido: 'Duarte' }),
      completa({ apellido: 'Ayala' }),
      filaVacia(),
    ]

    const despues = copiarHaciaAbajo(filas, 0, 'apellido')

    expect(despues[1].apellido).toBe('Ayala')
    expect(despues[2].apellido).toBe('Duarte')
  })

  it('no toca las de arriba', () => {
    const filas = [filaVacia(), completa({ apellido: 'Duarte' }), filaVacia()]

    const despues = copiarHaciaAbajo(filas, 1, 'apellido')

    expect(despues[0].apellido).toBe('')
    expect(despues[2].apellido).toBe('Duarte')
  })

  it('desde una celda vacía no copia nada', () => {
    const filas = [filaVacia(), filaVacia()]

    expect(copiarHaciaAbajo(filas, 0, 'apellido')).toBe(filas)
  })
})

describe('las columnas de la planilla', () => {
  it('el documento va primero: el vendedor tiene la pila de cédulas en la mano', () => {
    expect(COLUMNAS[0].campo).toBe('numeroDocumento')
  })

  it('son once obligatorias más las observaciones', () => {
    expect(COLUMNAS.filter((columna) => columna.obligatorio)).toHaveLength(11)
    expect(COLUMNAS).toHaveLength(12)
  })
})
