/**
 * Formateo de números, dinero y fechas para el panel.
 *
 * Está centralizado por una razón concreta: los importes del backend llegan a
 * veces como `number` y a veces como `string` (`PagoPendienteDto.importeTotal`
 * nunca pasa por `parseFloat`, `VentaListaDto.importeTotal` sí). Formatear en
 * cada componente significaba que la mitad de las tarjetas mostraran
 * `"150000.00"` sin separadores y la otra mitad `150.000`.
 */

const LOCALE = 'es-PY'

const formateadorGuaranies = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'PYG',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const formateadorEntero = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
})

const formateadorCompacto = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const formateadorPorcentaje = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/**
 * Normaliza a número cualquier cosa que devuelva el backend.
 *
 * Devuelve 0 —no `NaN`— ante `null`, `undefined`, `''` o texto no numérico:
 * un total que no se pudo leer es una fila vacía, no "NaN" en pantalla.
 */
export function aNumero(valor: unknown): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0
  if (typeof valor === 'string') {
    const n = Number.parseFloat(valor)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

/** `1234567` → `"Gs. 1.234.567"`. Los guaraníes no tienen centavos. */
export function formatearGuaranies(valor: unknown): string {
  return formateadorGuaranies.format(aNumero(valor))
}

/**
 * Versión corta para ejes y espacios angostos: `1234567` → `"Gs. 1,2 M"`.
 * Nunca para el valor principal de una tarjeta — ahí se muestra completo.
 *
 * El separador es un espacio duro, igual que el que pone `Intl` en el
 * formateador de moneda: así "Gs." nunca queda colgado al final de una línea.
 */
export function formatearGuaraniesCompacto(valor: unknown): string {
  return `Gs.\u00A0${formateadorCompacto.format(aNumero(valor))}`
}

/** `1234` → `"1.234"`. Para conteos: ventas, boletos, clientes. */
export function formatearEntero(valor: unknown): string {
  return formateadorEntero.format(Math.round(aNumero(valor)))
}

/** `12.3456` → `"12,3%"`. El backend ya manda el porcentaje, no la fracción. */
export function formatearPorcentaje(valor: unknown): string {
  return `${formateadorPorcentaje.format(aNumero(valor))}%`
}

/**
 * Variación relativa entre dos períodos, en porcentaje.
 *
 * Devuelve `null` cuando el período anterior fue 0: no existe "creció un
 * infinito por ciento". Quien renderiza decide qué decir en ese caso — acá
 * mentir con un 100% sería peor que no mostrar nada.
 */
export function calcularVariacion(
  actual: unknown,
  anterior: unknown
): number | null {
  const a = aNumero(actual)
  const b = aNumero(anterior)
  if (b === 0) return null
  return ((a - b) / Math.abs(b)) * 100
}

/** `12.34` → `"+12,3%"`, `-5` → `"−5,0%"`, `null` → `"—"`. */
export function formatearVariacion(variacion: number | null): string {
  if (variacion === null || !Number.isFinite(variacion)) return '—'
  const signo = variacion > 0 ? '+' : variacion < 0 ? '−' : ''
  return `${signo}${formateadorPorcentaje.format(Math.abs(variacion))}%`
}

/**
 * Reparte un total en porcentajes que suman exactamente 100.
 *
 * Redondear cada parte por separado deja sumas de 99,9 o 100,1 debajo de un
 * gráfico de composición, que es justo donde el lector va a verificar la cuenta.
 * Acá el resto del redondeo se le asigna a la porción más grande.
 *
 * La garantía es sobre los valores **a una décima**, que es la precisión con la
 * que se muestran: 33,3 no es representable exacto en punto flotante, así que
 * la suma cruda de los dobles puede dar 99,99999999999999.
 */
export function repartirPorcentajes(valores: number[]): number[] {
  const total = valores.reduce((acc, v) => acc + v, 0)
  if (total === 0) return valores.map(() => 0)

  // Se trabaja en décimas enteras (1000 = 100,0%) y recién al final se divide.
  // Sumar 33,3 + 33,3 + 33,4 en punto flotante da 99,99999999999999, y ese
  // "casi 100" es justo lo que este ajuste existe para evitar.
  const decimas = valores.map((v) => Math.round((v / total) * 1000))
  const suma = decimas.reduce((acc, v) => acc + v, 0)
  const resto = 1000 - suma

  if (resto !== 0) {
    let mayor = 0
    for (let i = 1; i < decimas.length; i++) {
      if (decimas[i] > decimas[mayor]) mayor = i
    }
    decimas[mayor] += resto
  }

  return decimas.map((d) => d / 10)
}

/** `'2026-08-21'` → `"21/08/2026"`. Devuelve `'—'` si la fecha no es válida. */
export function formatearFecha(
  valor: string | Date | null | undefined
): string {
  const fecha = aFecha(valor)
  if (!fecha) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(fecha)
}

/** `'2026-08-21T14:30:00Z'` → `"21/08/2026 11:30"`. */
export function formatearFechaHora(
  valor: string | Date | null | undefined
): string {
  const fecha = aFecha(valor)
  if (!fecha) return '—'
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)
}

/** Etiqueta corta para ejes temporales: `'2026-08-21'` → `"21 ago"`. */
export function formatearFechaCorta(
  valor: string | Date | null | undefined
): string {
  const fecha = aFecha(valor)
  if (!fecha) return '—'
  const texto = new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: 'short',
  }).format(fecha)
  // es-PY devuelve "21-ago." — se normaliza a "21 ago".
  return texto.replace(/[-.]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * Convierte a `Date` tolerando los formatos que manda el backend.
 *
 * `'2026-08-21'` (columna `date` de Postgres) lo interpreta el navegador como
 * UTC, así que en Paraguay (UTC−3/−4) se muestra un día antes. Por eso las
 * fechas sin hora se construyen como fecha local explícita.
 */
export function aFecha(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor

  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor)
  if (soloFecha) {
    const [, a, m, d] = soloFecha
    return new Date(Number(a), Number(m) - 1, Number(d))
  }

  const fecha = new Date(valor)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}
