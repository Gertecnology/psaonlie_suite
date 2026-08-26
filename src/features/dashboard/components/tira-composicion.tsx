import {
  formatearGuaranies,
  formatearPorcentaje,
  repartirPorcentajes,
} from '@/lib/formato'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface SegmentoTira {
  clave: string
  etiqueta: string
  /** Una línea explicando qué es. Aparece en el tooltip. */
  descripcion?: string
  monto: number
  /** Token de color. El color sigue a la entidad, nunca al orden. */
  color: string
  /** Dato secundario para la lista: cantidad de ventas, por ejemplo. */
  nota?: string
}

interface Props {
  titulo?: string
  total: number
  segmentos: SegmentoTira[]
  className?: string
}

/**
 * Un total repartido en sus partes: una tira apilada más su lista de valores.
 *
 * Tres decisiones que la hacen legible y que conviene no deshacer:
 *
 * - **Los segmentos se separan con un hueco de 2px del color de la superficie**,
 *   no con un borde. Un contorno alrededor de cada segmento agrega tinta que no
 *   es dato y engorda visualmente la tira.
 * - **Adentro del segmento no va texto.** Varios tonos de la paleta no dan
 *   contraste suficiente para texto encima en modo claro, y un segmento angosto
 *   recortaría la etiqueta. Los valores completos están en la lista de abajo.
 * - **Los porcentajes suman exactamente 100.** Redondear cada uno por separado
 *   deja sumas de 99,9 justo donde el lector va a verificar la cuenta.
 */
export function TiraComposicion({
  titulo,
  total,
  segmentos,
  className,
}: Props) {
  const visibles = segmentos.filter((s) => s.monto > 0)
  const porcentajes = repartirPorcentajes(visibles.map((s) => s.monto))

  if (visibles.length === 0) return null

  return (
    <div className={className}>
      {titulo && (
        <div className='mb-2 flex items-baseline justify-between gap-4'>
          <h4 className='text-foreground text-sm font-medium'>{titulo}</h4>
          <span className='text-muted-foreground text-xs tabular-nums'>
            {formatearGuaranies(total)}
          </span>
        </div>
      )}

      <TooltipProvider delayDuration={100}>
        <div
          className='flex h-9 w-full gap-[2px] rounded-md'
          role='group'
          aria-label={`${titulo ?? 'Composición'}: ${formatearGuaranies(total)}`}
        >
          {visibles.map((segmento, indice) => (
            <Tooltip key={segmento.clave}>
              <TooltipTrigger asChild>
                <button
                  type='button'
                  className={cn(
                    'h-full min-w-0',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none',
                    'first:rounded-s-md last:rounded-e-md',
                  )}
                  style={{
                    width: `${porcentajes[indice]}%`,
                    backgroundColor: segmento.color,
                  }}
                >
                  <span className='sr-only'>
                    {segmento.etiqueta}: {formatearGuaranies(segmento.monto)},{' '}
                    {formatearPorcentaje(porcentajes[indice])}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='font-medium'>
                  {formatearGuaranies(segmento.monto)}
                </p>
                <p className='text-xs opacity-80'>{segmento.etiqueta}</p>
                {segmento.descripcion && (
                  <p className='text-xs opacity-80'>{segmento.descripcion}</p>
                )}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>

      {/* La lista es la leyenda y a la vez la tabla de valores: el tooltip
          nunca es la única forma de leer un número. */}
      <dl className='mt-2 flex flex-wrap gap-x-5 gap-y-1'>
        {visibles.map((segmento, indice) => (
          <div key={segmento.clave} className='flex items-center gap-1.5'>
            <span
              aria-hidden
              className='size-2.5 shrink-0 rounded-sm'
              style={{ backgroundColor: segmento.color }}
            />
            <dt className='text-muted-foreground text-xs'>
              {segmento.etiqueta}
            </dt>
            <dd className='text-foreground text-xs font-medium tabular-nums'>
              {formatearGuaranies(segmento.monto)}
              <span className='text-muted-foreground ms-1 font-normal'>
                ({formatearPorcentaje(porcentajes[indice])}
                {segmento.nota ? ` · ${segmento.nota}` : ''})
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
