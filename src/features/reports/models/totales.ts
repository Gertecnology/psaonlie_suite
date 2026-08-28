/**
 * Totales de una planilla que el backend no totaliza.
 *
 * Varios endpoints devuelven `periodo` y `data` y nada más. Sumar la columna
 * del lado del panel es legítimo **sólo si la hoja lista todos los renglones
 * del período**: entonces el total es la suma de lo que está a la vista y
 * cualquiera lo verifica con una calculadora.
 *
 * Deja de serlo en cuanto la respuesta viene recortada. Un total que dice ser
 * del período pero suma una página es una cifra que no existe en ninguna otra
 * parte del sistema, y es exactamente el error que este módulo evita: cuando
 * hay renglones fuera de la hoja, `alcanceDeLosTotales` lo escribe debajo del
 * rótulo en vez de callarlo.
 */

/** Suma una columna de importes o de conteos. */
export function sumar<T>(filas: readonly T[], valor: (fila: T) => number): number {
  return filas.reduce((acumulado, fila) => acumulado + (Number(valor(fila)) || 0), 0)
}

/**
 * Qué dice la fila de cierre debajo del rótulo.
 *
 * `undefined` cuando la hoja tiene todo: no hace falta aclarar nada. Un texto
 * cuando quedaron renglones afuera, porque ahí el total ya no es del período.
 */
export function alcanceDeLosTotales(
  listados: number,
  totalDelPeriodo: number | undefined,
): string | undefined {
  if (totalDelPeriodo === undefined || totalDelPeriodo <= listados) return undefined
  return `suma de los ${listados} renglones listados; el período tiene ${totalDelPeriodo}`
}

/**
 * El rótulo de la fila de cierre, acorde a lo anterior.
 *
 * Si la hoja no tiene todo, deja de decir «del período»: el rótulo es lo
 * primero que lee quien firma.
 */
export function rotuloDeLosTotales(
  listados: number,
  totalDelPeriodo: number | undefined,
): string {
  const completo = totalDelPeriodo === undefined || totalDelPeriodo <= listados
  return completo ? 'Totales del período' : 'Totales de lo listado'
}
