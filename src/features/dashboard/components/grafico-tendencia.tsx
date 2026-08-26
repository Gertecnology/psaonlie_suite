import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  formatearFechaCorta,
  formatearGuaranies,
  formatearGuaraniesCompacto,
} from '@/lib/formato'
import type { Periodo } from '@/lib/periodo'
import {
  ChartContainer,
  ChartLegend,
  ChartTooltipContent,
  COLOR_CONTEXTO,
  type ChartConfig,
} from '@/components/ui/chart'
import type { EstadisticasTemporales } from '../models/estadisticas.model'
import { armarSerieComparada } from '../models/series.model'
import { EstadoVacio, SkeletonGrafico } from './estados'

const CONFIG: ChartConfig = {
  actual: { label: 'Período actual', color: 'var(--chart-1)' },
  anterior: { label: 'Período anterior', color: COLOR_CONTEXTO },
}

interface Props {
  periodo: Periodo
  anterior: Periodo
  temporalesActual: EstadisticasTemporales[] | undefined
  temporalesAnterior: EstadisticasTemporales[] | undefined
  cargando: boolean
}

/**
 * Tendencia del período contra el anterior.
 *
 * Un solo eje de valores, las dos series en guaraníes. El período actual va en
 * el color de acento y el anterior en gris: la comparación es contexto, no una
 * segunda protagonista.
 *
 * NOTA SOBRE EL DATO: se grafica `monto`, que es el pasaje **vendido** (pagado
 * o no). El backend expone además `montoCompletado` por día, pero llega
 * siempre en 0 por un error de mayúsculas en los alias SQL — Postgres pliega
 * `as montoCompletado` a `montocompletado` y el mapper lee la clave camelCase.
 * PENDIENTE DE AJUSTE (backend): cuando se corrija, acá se puede mostrar la
 * curva de lo efectivamente cobrado, que es la que más importa.
 */
export function GraficoTendencia({
  periodo,
  anterior,
  temporalesActual,
  temporalesAnterior,
  cargando,
}: Props) {
  const datos = useMemo(
    () =>
      armarSerieComparada(
        periodo,
        anterior,
        temporalesActual ?? [],
        temporalesAnterior ?? [],
      ),
    [periodo, anterior, temporalesActual, temporalesAnterior],
  )

  if (cargando && !temporalesActual) return <SkeletonGrafico alto={280} />

  const hayMovimiento = datos.some((p) => p.actual > 0 || (p.anterior ?? 0) > 0)

  if (!hayMovimiento) {
    return (
      <EstadoVacio
        titulo='Sin ventas en el período'
        descripcion='No hubo ventas ni en este período ni en el anterior. Ampliá el rango de fechas o quitá el filtro de empresa.'
      />
    )
  }

  return (
    <div>
      <ChartLegend config={CONFIG} marca='line' className='mb-3' />

      <ChartContainer alto={280}>
        <AreaChart
          data={datos}
          margin={{ top: 4, right: 8, bottom: 0, left: 8 }}
          accessibilityLayer
        >
          <defs>
            <linearGradient id='relleno-actual' x1='0' y1='0' x2='0' y2='1'>
              <stop
                offset='0%'
                stopColor='var(--chart-1)'
                stopOpacity={0.18}
              />
              <stop
                offset='100%'
                stopColor='var(--chart-1)'
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke='var(--border)'
            strokeDasharray='0'
            vertical={false}
          />

          <XAxis
            dataKey='dia'
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            minTickGap={24}
            tickFormatter={(dia: number) =>
              formatearFechaCorta(datos[dia - 1]?.fechaActual ?? null)
            }
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            width={78}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={(valor: number) =>
              formatearGuaraniesCompacto(valor)
            }
          />

          <RechartsTooltip
            cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
            content={(props) => (
              <ChartTooltipContent
                {...props}
                config={CONFIG}
                formatearValor={formatearGuaranies}
                formatearEtiqueta={(dia) => {
                  const punto = datos[Number(dia) - 1]
                  if (!punto) return ''
                  const a = formatearFechaCorta(punto.fechaActual)
                  const b = formatearFechaCorta(punto.fechaAnterior)
                  return `${a} · anterior: ${b}`
                }}
              />
            )}
          />

          {/* El anterior va primero para quedar debajo del actual. */}
          <Area
            type='monotone'
            dataKey='anterior'
            stroke={COLOR_CONTEXTO}
            strokeWidth={2}
            fill='none'
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            connectNulls
            isAnimationActive={false}
          />
          <Area
            type='monotone'
            dataKey='actual'
            stroke='var(--chart-1)'
            strokeWidth={2}
            fill='url(#relleno-actual)'
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--card)' }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}
