import type { ReactNode } from 'react'
import { IconMinus, IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { formatearVariacion } from '@/lib/formato'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Props {
  etiqueta: string
  /** Valor ya formateado. */
  valor: string
  /** Qué es este número, en una línea. */
  descripcion?: ReactNode
  /** Variación contra el período anterior. `null` = sin base de comparación. */
  variacion?: number | null
  /** `true` cuando subir es bueno (ingresos), `false` cuando es malo. */
  subirEsBueno?: boolean
  /** Marca la tarjeta como la principal del grupo. */
  destacada?: boolean
  className?: string
}

/**
 * Tarjeta de métrica.
 *
 * El valor usa cifras proporcionales, no `tabular-nums`: a este tamaño las
 * cifras de ancho fijo hacen que un número como 121 se vea suelto. Las
 * tabulares quedan para las columnas de las tablas, donde sí tienen que
 * alinearse verticalmente.
 */
export function TarjetaMetrica({
  etiqueta,
  valor,
  descripcion,
  variacion,
  subirEsBueno = true,
  destacada = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'border-border flex flex-col gap-1.5 rounded-xl border p-4',
        destacada && 'bg-card',
        className,
      )}
    >
      <p className='text-muted-foreground text-xs font-medium'>{etiqueta}</p>

      <p
        className={cn(
          'text-foreground leading-none font-semibold',
          destacada ? 'text-3xl sm:text-4xl' : 'text-2xl',
        )}
      >
        {valor}
      </p>

      <div className='mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5'>
        {variacion !== undefined && (
          <Variacion variacion={variacion} subirEsBueno={subirEsBueno} />
        )}
        {descripcion && (
          <span className='text-muted-foreground text-xs'>{descripcion}</span>
        )}
      </div>
    </div>
  )
}

function Variacion({
  variacion,
  subirEsBueno,
}: {
  variacion: number | null
  subirEsBueno: boolean
}) {
  if (variacion === null) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
              <IconMinus className='size-3' aria-hidden />
              Sin comparación
            </span>
          </TooltipTrigger>
          <TooltipContent>
            El período anterior no tuvo movimiento, así que no hay contra qué
            comparar.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const sube = variacion > 0
  const plano = Math.abs(variacion) < 0.05
  const bueno = sube === subirEsBueno

  const Icono = plano ? IconMinus : sube ? IconTrendingUp : IconTrendingDown

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium tabular-nums',
        plano
          ? 'text-muted-foreground'
          : bueno
            ? 'text-[var(--estado-ok)]'
            : 'text-[var(--estado-critico)]',
      )}
    >
      {/* El ícono acompaña siempre al número: el color no puede ser el único
          canal que diga si la variación es buena o mala. */}
      <Icono className='size-3' aria-hidden />
      {formatearVariacion(variacion)}
      <span className='sr-only'>
        {plano
          ? 'sin cambios respecto al período anterior'
          : sube
            ? 'de aumento respecto al período anterior'
            : 'de caída respecto al período anterior'}
      </span>
    </span>
  )
}
