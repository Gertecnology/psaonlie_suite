import { cn } from '@/lib/utils'
import type { Asiento } from '../../models/sales.model'
import {
  BORDES_POR_CALIDAD,
  leerCalidades,
} from '../../utils/las-calidades-del-servicio'
import { formatearGuaranies } from '../../utils/money'

/**
 * Qué significa cada dibujo del plano.
 *
 * Va en una sola línea al pie del plano: era una grilla de cuatro celdas con
 * título, ícono, etiqueta y descripción —«Disponible / Asiento disponible»—
 * que ocupaba el alto de tres filas de butacas para no decir nada nuevo.
 *
 * El estado nunca se comunica sólo con color: la ocupada va rayada y con el
 * borde punteado, y las calidades se distinguen por la forma del borde.
 */

const RAYADO_DE_OCUPADA = {
  backgroundImage:
    'repeating-linear-gradient(135deg, var(--muted) 0 3px, transparent 3px 6px)',
} as const

export function SeatLegend({ asientos = [] }: { asientos?: Asiento[] }) {
  const calidades = leerCalidades(asientos)

  return (
    <div className='text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px]'>
      <span className='flex items-center gap-1.5'>
        <i className='border-input bg-card block h-3.5 w-3.5 rounded-[3px] border' />
        Libre
      </span>
      <span className='flex items-center gap-1.5'>
        <i
          className='border-border block h-3.5 w-3.5 rounded-[3px] border border-dashed'
          style={RAYADO_DE_OCUPADA}
        />
        Ocupada
      </span>
      <span className='flex items-center gap-1.5'>
        <i className='bg-primary block h-3.5 w-3.5 rounded-[3px]' />
        Tuya
      </span>
      <span className='flex items-center gap-1.5'>
        <i className='border-border block h-3.5 w-3.5 border-r border-l border-dashed' />
        Pasillo
      </span>

      {/* Las calidades sólo se explican si hay más de una: en un colectivo de
          una sola calidad la muestra no distingue nada de nada. */}
      {calidades.length > 1 && (
        <span className='ml-auto flex flex-wrap items-center gap-x-3.5 gap-y-2'>
          {calidades.map((calidad, indice) => (
            <span key={calidad.calidad} className='flex items-center gap-1.5'>
              <i
                className={cn(
                  'border-input block h-3.5 w-3.5 rounded-[3px]',
                  BORDES_POR_CALIDAD[indice] ?? BORDES_POR_CALIDAD[0]
                )}
              />
              <b className='text-foreground font-semibold'>{calidad.calidad}</b>
              {formatearGuaranies(calidad.precio)}
            </span>
          ))}
        </span>
      )}
    </div>
  )
}
