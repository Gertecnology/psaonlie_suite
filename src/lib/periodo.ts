/**
 * Rango de fechas del panel.
 *
 * Un solo período gobierna todas las tarjetas, gráficos y tablas de una vista:
 * si cada gráfico tuviera su propio filtro, los números de la pantalla dejarían
 * de cuadrar entre sí.
 *
 * Dos detalles que importan y son fáciles de errar:
 *
 * 1. El backend filtra con `venta.fechaVenta BETWEEN :desde AND :hasta` sobre un
 *    `timestamp`. Mandar `'2026-08-21'` como `hasta` significa
 *    `2026-08-21T00:00:00`, o sea que **el día de hoy queda afuera**. Por eso
 *    `hasta` siempre se cierra a las 23:59:59.999.
 * 2. En la URL el período viaja como `YYYY-MM-DD` local. Serializarlo con
 *    `toISOString()` lo convierte a UTC y, en Paraguay, un rango que empieza el
 *    día 1 aparece empezando el 31 del mes anterior.
 */

export interface Periodo {
  desde: Date
  hasta: Date
}

export const PRESETS_PERIODO = [
  'hoy',
  'ayer',
  '7d',
  '30d',
  '90d',
  'mes',
  'mes-anterior',
  'anio',
  'personalizado',
] as const

export type PresetPeriodo = (typeof PRESETS_PERIODO)[number]

export const ETIQUETAS_PRESET: Record<PresetPeriodo, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
  mes: 'Este mes',
  'mes-anterior': 'Mes anterior',
  anio: 'Este año',
  personalizado: 'Personalizado',
}

/** Presets que se ofrecen como filas en el selector, en orden. */
export const PRESETS_VISIBLES: PresetPeriodo[] = [
  'hoy',
  'ayer',
  '7d',
  '30d',
  '90d',
  'mes',
  'mes-anterior',
  'anio',
]

/** Primer instante del día de `fecha`, en hora local. */
export function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Último instante del día de `fecha`, en hora local. */
export function finDelDia(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(23, 59, 59, 999)
  return d
}

function sumarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha)
  d.setDate(d.getDate() + dias)
  return d
}

/**
 * Construye el período de un preset.
 *
 * `hoy` recibe la fecha de referencia por parámetro para que los tests no
 * dependan del reloj de la máquina.
 */
export function periodoDesdePreset(
  preset: PresetPeriodo,
  hoy: Date = new Date()
): Periodo {
  const base = inicioDelDia(hoy)

  switch (preset) {
    case 'hoy':
      return { desde: base, hasta: finDelDia(base) }

    case 'ayer': {
      const ayer = sumarDias(base, -1)
      return { desde: ayer, hasta: finDelDia(ayer) }
    }

    // "Últimos N días" incluye hoy: 7 días son hoy y los 6 anteriores.
    case '7d':
      return { desde: sumarDias(base, -6), hasta: finDelDia(base) }
    case '30d':
      return { desde: sumarDias(base, -29), hasta: finDelDia(base) }
    case '90d':
      return { desde: sumarDias(base, -89), hasta: finDelDia(base) }

    case 'mes':
      return {
        desde: new Date(base.getFullYear(), base.getMonth(), 1),
        hasta: finDelDia(base),
      }

    case 'mes-anterior': {
      const desde = new Date(base.getFullYear(), base.getMonth() - 1, 1)
      const hasta = new Date(base.getFullYear(), base.getMonth(), 0)
      return { desde, hasta: finDelDia(hasta) }
    }

    case 'anio':
      return {
        desde: new Date(base.getFullYear(), 0, 1),
        hasta: finDelDia(base),
      }

    case 'personalizado':
      // Sin fechas guardadas, "personalizado" no tiene un rango propio.
      return periodoDesdePreset('30d', hoy)
  }
}

/**
 * Período inmediatamente anterior, de la misma duración.
 *
 * Sirve para comparar contra "el mismo tiempo, antes". El backend calcula lo
 * suyo con `hasta = desde` (los dos períodos se tocan en un instante); acá el
 * anterior termina 1 ms antes, así ninguna venta se cuenta dos veces.
 */
export function periodoAnterior(periodo: Periodo): Periodo {
  const duracion = periodo.hasta.getTime() - periodo.desde.getTime()
  const hasta = new Date(periodo.desde.getTime() - 1)
  const desde = new Date(hasta.getTime() - duracion)
  return { desde, hasta }
}

/** Cantidad de días que abarca el período (mínimo 1). */
export function diasDelPeriodo(periodo: Periodo): number {
  const ms = periodo.hasta.getTime() - periodo.desde.getTime()
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}

/** `Date` → `'YYYY-MM-DD'` en hora **local** (para la URL). */
export function aFechaISOLocal(fecha: Date): string {
  const a = fecha.getFullYear()
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${a}-${m}-${d}`
}

/** `'YYYY-MM-DD'` → `Date` local, o `null` si el texto no es una fecha. */
export function deFechaISOLocal(texto: string | undefined): Date | null {
  if (!texto) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto)
  if (!m) return null
  const fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

/**
 * Parámetros de fecha tal como los espera el backend.
 *
 * Se manda el instante completo en ISO/UTC, no `YYYY-MM-DD`: el filtro es
 * `BETWEEN` sobre un timestamp y truncar a medianoche deja afuera el último día.
 */
export function aParametrosApi(periodo: Periodo): {
  fechaDesde: string
  fechaHasta: string
} {
  return {
    fechaDesde: periodo.desde.toISOString(),
    fechaHasta: periodo.hasta.toISOString(),
  }
}

/** Texto legible del rango: `"01/08/2026 – 21/08/2026"`, o el día suelto. */
export function describirPeriodo(periodo: Periodo): string {
  const fmt = new Intl.DateTimeFormat('es-PY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const desde = fmt.format(periodo.desde)
  const hasta = fmt.format(periodo.hasta)
  return desde === hasta ? desde : `${desde} – ${hasta}`
}

/** Preset por defecto del panel. */
export const PRESET_POR_DEFECTO: PresetPeriodo = '30d'
