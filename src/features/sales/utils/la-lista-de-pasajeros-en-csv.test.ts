import { describe, expect, it } from 'vitest'
import { armarCsvDePasajeros } from './la-lista-de-pasajeros-en-csv'
import { filaVacia, type DatosDelPasajero } from './los-datos-del-pasajero'

/**
 * La lista de pasajeros en CSV.
 *
 * Existe para un caso concreto: se soltaron las butacas con dieciocho filas
 * cargadas, y media hora de trabajo se baja antes de tocar cualquier otro
 * botón.
 */

const pasajero = (cambios: Partial<DatosDelPasajero>): DatosDelPasajero => ({
  ...filaVacia(),
  ...cambios,
})

const lineas = (csv: string) => csv.replace('﻿', '').trim().split('\r\n')

describe('la lista de pasajeros en CSV', () => {
  it('la primera línea son los nombres de las columnas', () => {
    const csv = armarCsvDePasajeros([])

    expect(lineas(csv)[0]).toContain('"Documento"')
    expect(lineas(csv)[0]).toContain('"Nombres"')
  })

  it('una fila por pasajero, en el orden de la planilla', () => {
    const csv = armarCsvDePasajeros([
      pasajero({ numeroDocumento: '3481220', nombre: 'Ana', apellido: 'Duarte' }),
      pasajero({ numeroDocumento: '4112876', nombre: 'Luis', apellido: 'Duarte' }),
    ])

    expect(lineas(csv)).toHaveLength(3)
    expect(lineas(csv)[1]).toContain('"Ana"')
    expect(lineas(csv)[2]).toContain('"Luis"')
  })

  it('un nombre con coma no parte la fila en dos', () => {
    // «Duarte, Ana» dejaría el archivo corrido en Excel.
    const csv = armarCsvDePasajeros([pasajero({ nombre: 'Duarte, Ana' })])

    expect(lineas(csv)[1]).toContain('"Duarte, Ana"')
  })

  it('las comillas de adentro se duplican', () => {
    const csv = armarCsvDePasajeros([pasajero({ observaciones: 'dijo "urgente"' })])

    expect(lineas(csv)[1]).toContain('"dijo ""urgente"""')
  })

  it('lleva BOM: sin él Excel lee «Asunción» como «AsunciÃ³n»', () => {
    expect(armarCsvDePasajeros([])).toMatch(/^﻿/)
  })

  it('la butaca no va: cuando esto se usa, es lo que se perdió', () => {
    const csv = armarCsvDePasajeros([pasajero({ nombre: 'Ana' })])

    expect(lineas(csv)[0]).not.toContain('Butaca')
  })
})
