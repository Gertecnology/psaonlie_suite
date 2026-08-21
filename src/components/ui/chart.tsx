import * as React from 'react'
import { ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

/**
 * Primitivas de gráficos.
 *
 * Es una versión propia en vez del `chart.tsx` de shadcn porque ese apunta a
 * recharts 2 y acá está instalado recharts 3, que cambió la forma de las props
 * del tooltip. Se conservan los nombres del ecosistema (`ChartContainer`,
 * `ChartTooltipContent`, `ChartConfig`) para que el código se lea igual.
 *
 * Reglas de diseño que estas primitivas imponen, y que ningún gráfico debería
 * saltear:
 *
 * - **El color sigue a la entidad, nunca al ranking.** El color de una serie
 *   sale de su clave en el `ChartConfig`, no de su posición en la lista. Si un
 *   filtro cambia el orden, "Canindeyú" sigue siendo del mismo color.
 * - **La leyenda está siempre que haya 2 o más series.** El color nunca es el
 *   único canal de identidad: quien no distingue dos tonos igual lee la
 *   etiqueta.
 * - **El texto usa tokens de texto, nunca el color de la serie.** Los tonos
 *   claros de la paleta son ilegibles como texto; la identidad la lleva el
 *   cuadradito o la línea que va al lado.
 */

export interface ChartSeriesConfig {
  /** Texto que ve el usuario. */
  label: string
  /** Color de la marca. Siempre un token `var(--chart-N)`. */
  color: string
}

export type ChartConfig = Record<string, ChartSeriesConfig>

/**
 * Los ocho slots de la paleta categórica, en orden.
 *
 * Asignar SIEMPRE en orden y nunca ciclar: el orden es lo que garantiza que dos
 * series vecinas se distingan bajo daltonismo. Una novena serie no lleva un
 * color nuevo — se agrupa en "Otras".
 */
export const COLORES_SERIE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
] as const

/** Máximo de series con color propio. A partir de acá, "Otras". */
export const MAXIMO_SERIES = COLORES_SERIE.length

/** Gris de contexto, para la serie que no es el foco (período anterior, "Otras"). */
export const COLOR_CONTEXTO = 'var(--muted-foreground)'

/** Color del slot `indice`, en orden y sin ciclar. */
export function colorDeSerie(indice: number): string {
  return COLORES_SERIE[indice] ?? COLOR_CONTEXTO
}

interface ChartContainerProps extends React.ComponentProps<'figure'> {
  /** Alto del área de dibujo **más** la banda del eje X. */
  alto?: number
  children: React.ReactElement
}

/**
 * Contenedor responsivo de un gráfico.
 *
 * El alto incluye la banda del eje X a propósito: fijar sólo el alto del área
 * de dibujo deja las etiquetas del eje afuera y aparece un scroll vertical
 * diminuto adentro de la tarjeta.
 */
export function ChartContainer({
  alto = 260,
  className,
  children,
  ...props
}: ChartContainerProps) {
  return (
    <figure
      className={cn('w-full', className)}
      style={{ height: alto }}
      {...props}
    >
      <ResponsiveContainer width='100%' height='100%'>
        {children}
      </ResponsiveContainer>
    </figure>
  )
}

/** Props comunes de los ejes: retícula fina, recesiva, nunca punteada. */
export const ejeComun = {
  stroke: 'var(--border)',
  tickLine: false,
  axisLine: false,
  tick: { fill: 'var(--muted-foreground)', fontSize: 12 },
} as const

/** Props de la retícula: una hairline sólida, un paso por encima de la superficie. */
export const reticulaComun = {
  stroke: 'var(--border)',
  strokeDasharray: '0',
  vertical: false,
} as const

interface ItemTooltip {
  dataKey?: string | number
  name?: string | number
  value?: number | string | Array<number | string>
  color?: string
  payload?: Record<string, unknown>
}

interface ChartTooltipContentProps {
  active?: boolean
  payload?: readonly ItemTooltip[]
  label?: string | number
  config: ChartConfig
  /** Cómo se formatea el valor. Por defecto, número crudo. */
  formatearValor?: (valor: number) => string
  /** Cómo se formatea el encabezado. */
  formatearEtiqueta?: (etiqueta: string | number | undefined) => string
  /** Oculta las series cuyo valor sea 0. */
  ocultarCeros?: boolean
}

/**
 * Contenido del tooltip.
 *
 * Tres decisiones deliberadas:
 * - **Un solo tooltip lista todas las series** del punto: nadie tiene que
 *   apuntarle a una línea de 2px para leer su valor.
 * - **El valor manda, la etiqueta acompaña.** Al revés que en la leyenda:
 *   acá el lector ya sabe qué serie mira y lo que quiere es el número.
 * - **Las etiquetas se insertan como texto**, nunca como HTML: los nombres de
 *   empresa y ruta vienen de la base de datos y no son de fiar.
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  config,
  formatearValor = (v) => String(v),
  formatearEtiqueta,
  ocultarCeros = false,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null

  const items = ocultarCeros
    ? payload.filter((item) => Number(item.value) !== 0)
    : payload

  if (!items.length) return null

  const encabezado = formatearEtiqueta
    ? formatearEtiqueta(label)
    : label !== undefined
      ? String(label)
      : null

  return (
    <div className='bg-popover text-popover-foreground border-border min-w-[11rem] rounded-lg border p-3 shadow-md'>
      {encabezado && (
        <p className='text-muted-foreground mb-2 text-xs font-medium'>
          {encabezado}
        </p>
      )}
      <ul className='space-y-1.5'>
        {items.map((item, indice) => {
          const clave = String(item.dataKey ?? item.name ?? indice)
          const serie = config[clave]
          return (
            <li
              key={clave}
              className='flex items-center justify-between gap-4 text-sm'
            >
              <span className='flex min-w-0 items-center gap-2'>
                {/* Línea corta, no un bloque: a esta densidad un cuadrado
                    lleno es tinta de dato haciendo trabajo de etiqueta. */}
                <span
                  aria-hidden
                  className='h-0.5 w-3 shrink-0 rounded-full'
                  style={{
                    backgroundColor:
                      serie?.color ?? item.color ?? COLOR_CONTEXTO,
                  }}
                />
                <span className='text-muted-foreground truncate'>
                  {serie?.label ?? String(item.name ?? clave)}
                </span>
              </span>
              <span className='text-foreground shrink-0 font-medium tabular-nums'>
                {formatearValor(Number(item.value ?? 0))}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

interface ChartLegendProps {
  config: ChartConfig
  /** Claves a mostrar y en qué orden. Por defecto, las del config. */
  claves?: string[]
  /** `line` para gráficos de línea, `rect` para barras y áreas. */
  marca?: 'line' | 'rect'
  className?: string
}

/**
 * Leyenda.
 *
 * Va siempre que haya dos o más series. La marca espeja la del gráfico —una
 * línea para líneas, un rectángulo para barras— para que el ojo la asocie sin
 * pensar.
 */
export function ChartLegend({
  config,
  claves,
  marca = 'rect',
  className,
}: ChartLegendProps) {
  const entradas = (claves ?? Object.keys(config))
    .map((clave) => [clave, config[clave]] as const)
    .filter((par): par is [string, ChartSeriesConfig] => Boolean(par[1]))

  if (entradas.length < 2) return null

  return (
    <ul
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs',
        className
      )}
    >
      {entradas.map(([clave, serie]) => (
        <li key={clave} className='flex items-center gap-1.5'>
          <span
            aria-hidden
            className={cn(
              'shrink-0',
              marca === 'line'
                ? 'h-0.5 w-3 rounded-full'
                : 'h-2.5 w-2.5 rounded-sm'
            )}
            style={{ backgroundColor: serie.color }}
          />
          <span className='text-muted-foreground'>{serie.label}</span>
        </li>
      ))}
    </ul>
  )
}
