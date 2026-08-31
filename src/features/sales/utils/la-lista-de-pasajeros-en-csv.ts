import { COLUMNAS, type DatosDelPasajero } from './los-datos-del-pasajero'

/**
 * La lista de pasajeros como CSV, para bajarla antes de arriesgar nada.
 *
 * Existe por un caso concreto: se soltaron las butacas con dieciocho filas
 * cargadas. Media hora de trabajo se baja a un archivo antes de tocar cualquier
 * otro botón — y si algo más sale mal, la lista sigue estando.
 *
 * La butaca no va: cuando esto se usa, es justamente lo que se perdió.
 */

/**
 * Un campo de CSV.
 *
 * Se entrecomilla siempre y se duplican las comillas de adentro. Un nombre con
 * coma —«Duarte, Ana»— parte la fila en dos columnas si no se hace, y el
 * archivo abre corrido en Excel sin que nadie entienda por qué.
 */
function campo(valor: string): string {
  return `"${(valor ?? '').replace(/"/g, '""')}"`
}

export function armarCsvDePasajeros(filas: DatosDelPasajero[]): string {
  const columnas = COLUMNAS

  const encabezado = columnas.map((columna) => campo(columna.etiqueta))
  const cuerpo = filas.map((fila) =>
    columnas.map((columna) => campo(fila[columna.campo] ?? '')).join(',')
  )

  // BOM adelante: sin él, Excel en Windows abre el archivo en Latin-1 y
  // «Asunción» se lee «AsunciÃ³n».
  return `﻿${[encabezado.join(','), ...cuerpo].join('\r\n')}\r\n`
}

/** Baja el CSV con un nombre que dice de qué venta es. */
export function descargarLaLista(
  filas: DatosDelPasajero[],
  nombre = 'pasajeros'
): void {
  const csv = armarCsvDePasajeros(filas)
  const enlace = document.createElement('a')

  enlace.href = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  )
  enlace.download = `${nombre}.csv`
  enlace.click()

  // El objeto queda en memoria hasta que se lo suelta explícitamente.
  URL.revokeObjectURL(enlace.href)
}
