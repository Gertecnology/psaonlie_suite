/**
 * Normalización de números de asiento.
 *
 * El backend formatea los asientos antes de mandarlos a la empresa
 * (`AsientoService.formatearNumeroAsiento`): les saca el prefijo de letra y los
 * rellena a dos dígitos. La respuesta de bloqueo vuelve con ese formato, así
 * que el asiento "5" que el operador eligió vuelve como "05". Sin normalizar,
 * comparar lo pedido contra lo bloqueado da siempre "no coincide".
 */
export function normalizarNumeroAsiento(numero: string): string {
  const texto = String(numero ?? '').trim().toUpperCase()

  const soloNumero = texto.match(/^\d+$/)
  if (soloNumero) {
    return parseInt(texto, 10).toString().padStart(2, '0')
  }

  const conLetra = texto.match(/^[A-Z]+(\d+)$/)
  if (conLetra) {
    return parseInt(conLetra[1], 10).toString().padStart(2, '0')
  }

  return texto
}

/** Compara dos números de asiento sin importar el formato. */
export function mismoAsiento(a: string, b: string): boolean {
  return normalizarNumeroAsiento(a) === normalizarNumeroAsiento(b)
}

/**
 * Devuelve los asientos pedidos que NO figuran en la lista de bloqueados.
 * Lista vacía = el bloqueo cubrió todo lo que se pidió.
 */
export function asientosFaltantes(
  pedidos: ReadonlyArray<string>,
  bloqueados: ReadonlyArray<string>,
): string[] {
  const bloqueadosNormalizados = new Set(
    bloqueados.map(normalizarNumeroAsiento),
  )

  return pedidos.filter(
    (asiento) => !bloqueadosNormalizados.has(normalizarNumeroAsiento(asiento)),
  )
}
