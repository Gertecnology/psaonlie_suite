/**
 * El importe en letras, como se escribe al pie de un documento contable.
 *
 * No es un adorno: es la defensa contra un dígito alterado después de imprimir.
 * Un total en cifras se puede retocar; el mismo total escrito en palabras, no
 * sin que se note.
 *
 * Guaraníes, así que no hay centavos: el importe se redondea al entero antes de
 * escribirse. Un decimal en letras sería una precisión que la moneda no tiene.
 */

const UNIDADES = [
  '',
  // «un» y no «uno»: en un importe la palabra siempre precede al sustantivo.
  'un',
  'dos',
  'tres',
  'cuatro',
  'cinco',
  'seis',
  'siete',
  'ocho',
  'nueve',
  'diez',
  'once',
  'doce',
  'trece',
  'catorce',
  'quince',
  'dieciséis',
  'diecisiete',
  'dieciocho',
  'diecinueve',
  'veinte',
  // Apocopado, como va siempre acá: delante de «guaraníes», de «mil» o de
  // «millones» nunca se escribe «veintiuno».
  'veintiún',
  'veintidós',
  'veintitrés',
  'veinticuatro',
  'veinticinco',
  'veintiséis',
  'veintisiete',
  'veintiocho',
  'veintinueve',
] as const

const DECENAS: Record<number, string> = {
  30: 'treinta',
  40: 'cuarenta',
  50: 'cincuenta',
  60: 'sesenta',
  70: 'setenta',
  80: 'ochenta',
  90: 'noventa',
}

const CENTENAS: Record<number, string> = {
  100: 'ciento',
  200: 'doscientos',
  300: 'trescientos',
  400: 'cuatrocientos',
  500: 'quinientos',
  600: 'seiscientos',
  700: 'setecientos',
  800: 'ochocientos',
  900: 'novecientos',
}

/** Un grupo de hasta tres cifras. */
function hastaNovecientosNoventaYNueve(n: number): string {
  if (n === 0) return ''
  if (n < 30) return UNIDADES[n]
  if (n < 100) {
    const decena = Math.floor(n / 10) * 10
    const unidad = n % 10
    return unidad === 0
      ? DECENAS[decena]
      : `${DECENAS[decena]} y ${UNIDADES[unidad]}`
  }
  // «cien» es exacto; con cualquier resto pasa a ser «ciento».
  if (n === 100) return 'cien'
  const centena = Math.floor(n / 100) * 100
  const resto = n % 100
  return resto === 0
    ? CENTENAS[centena]
    : `${CENTENAS[centena]} ${hastaNovecientosNoventaYNueve(resto)}`
}

/** Los millares dentro de un grupo de millones: «doscientos treinta y cuatro mil». */
function hastaNovecientosNoventaYNueveMil(n: number): string {
  if (n < 1000) return hastaNovecientosNoventaYNueve(n)
  const miles = Math.floor(n / 1000)
  const resto = n % 1000
  const cabeza =
    miles === 1 ? 'mil' : `${hastaNovecientosNoventaYNueve(miles)} mil`
  return resto === 0 ? cabeza : `${cabeza} ${hastaNovecientosNoventaYNueve(resto)}`
}

/**
 * `1234500` → `'Un millón doscientos treinta y cuatro mil quinientos guaraníes.'`
 *
 * Un importe negativo se escribe con «menos» adelante: en una liquidación un
 * saldo puede quedar en contra, y omitir el signo invierte lo que dice el
 * documento.
 */
export function importeEnLetras(valor: unknown): string {
  const numero = Math.round(Number(valor) || 0)
  const negativo = numero < 0
  const absoluto = Math.abs(numero)

  if (absoluto === 0) return 'Cero guaraníes.'

  const partes: string[] = []
  const millones = Math.floor(absoluto / 1_000_000)
  const resto = absoluto % 1_000_000

  if (millones > 0) {
    partes.push(
      millones === 1
        ? 'un millón'
        : `${hastaNovecientosNoventaYNueveMil(millones)} millones`,
    )
  }

  const miles = Math.floor(resto / 1000)
  const unidades = resto % 1000
  if (miles > 0) {
    partes.push(
      miles === 1 ? 'mil' : `${hastaNovecientosNoventaYNueve(miles)} mil`,
    )
  }
  if (unidades > 0) partes.push(hastaNovecientosNoventaYNueve(unidades))

  const texto = partes.join(' ')
  const conSigno = negativo ? `menos ${texto}` : texto

  // «Un millón DE guaraníes», pero «un millón quinientos guaraníes»: la
  // preposición sólo aparece cuando los millones no llevan resto detrás.
  const soloMillones = millones > 0 && resto === 0
  const cierre = soloMillones ? 'de guaraníes.' : 'guaraníes.'

  return `${conSigno.charAt(0).toUpperCase()}${conSigno.slice(1)} ${cierre}`
}
