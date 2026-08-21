import * as XLSX from 'xlsx'
import { descargarBlob } from '@/utils/api-client'

/**
 * Exportación a Excel de los informes agregados.
 *
 * Los informes de detalle (ventas) los exporta el **backend**, que arma el
 * archivo sobre el conjunto filtrado completo sin paginar. Los agregados no
 * tienen endpoint de exportación, así que el archivo se arma acá — pero con
 * los mismos datos que ya calculó el servidor, no con un recorte del cliente.
 *
 * Una sola función arma el archivo a partir de columnas declaradas. Antes había
 * dos caminos —uno para CSV y otro para XLSX— que emitían **columnas
 * distintas** del mismo dato: el de CSV unía todas las claves y las ordenaba
 * alfabéticamente, el de Excel usaba un orden fijo con anchos desalineados.
 */

export interface ColumnaExcel<T> {
  encabezado: string
  /** Valor de la celda. Texto o número; los números quedan como números. */
  valor: (fila: T) => string | number
  /** Ancho en caracteres. Por defecto se estima con el encabezado. */
  ancho?: number
}

interface OpcionesExportacion<T> {
  nombreArchivo: string
  nombreHoja?: string
  columnas: ColumnaExcel<T>[]
  filas: T[]
  /** Fila de totales al pie, opcional. */
  totales?: (string | number)[]
}

/**
 * Genera y descarga un `.xlsx`.
 *
 * Los importes van como número, no como texto ya formateado: quien recibe el
 * archivo necesita poder sumarlos en la planilla. El formato se aplica con el
 * formato de celda de Excel, no concatenando "Gs.".
 */
export function exportarAExcel<T>({
  nombreArchivo,
  nombreHoja = 'Informe',
  columnas,
  filas,
  totales,
}: OpcionesExportacion<T>): void {
  const encabezados = columnas.map((c) => c.encabezado)
  const cuerpo = filas.map((fila) => columnas.map((c) => c.valor(fila)))

  const datos: (string | number)[][] = [encabezados, ...cuerpo]
  if (totales) datos.push(totales)

  const hoja = XLSX.utils.aoa_to_sheet(datos)

  // Un ancho por columna, en el mismo orden que los encabezados. Que las dos
  // listas se declaren juntas es lo que evita que se desalineen.
  hoja['!cols'] = columnas.map((c) => ({
    wch: c.ancho ?? Math.max(12, c.encabezado.length + 2),
  }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, nombreHoja)

  const buffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const marca = new Date().toISOString().slice(0, 10)
  descargarBlob(blob, `${nombreArchivo}-${marca}.xlsx`)
}
