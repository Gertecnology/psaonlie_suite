import { Input } from '@/components/ui/input'
import { CampoDeFiltro } from './campo-de-filtro'

interface FiltroDeRangoDeFechasProps {
  id: string
  etiqueta?: string
  /** `YYYY-MM-DD`, o `undefined` si no se acotó. */
  desde?: string
  hasta?: string
  onCambiar: (rango: { desde?: string; hasta?: string }) => void
  className?: string
}

/**
 * El rango de fechas: desde y hasta, los dos inclusive.
 *
 * Los campos son nativos (`type='date'`) a propósito. Toman y devuelven
 * `YYYY-MM-DD`, que es exactamente lo que la API exige y lo que rechaza si
 * viene con zona horaria; un selector propio agregaría una conversión que
 * puede equivocar el formato o correr el día por el huso.
 *
 * `min` y `max` cruzados impiden armar un rango invertido en el propio
 * control, en vez de dejar que el servidor lo rechace después de un viaje de
 * ida y vuelta.
 */
export function FiltroDeRangoDeFechas({
  id,
  etiqueta = 'Período',
  desde,
  hasta,
  onCambiar,
  className,
}: FiltroDeRangoDeFechasProps) {
  return (
    <div className={className}>
      <CampoDeFiltro etiqueta={etiqueta} htmlFor={`${id}-desde`}>
        <div className='flex items-center gap-1.5'>
          <Input
            id={`${id}-desde`}
            type='date'
            aria-label={`${etiqueta} desde`}
            className='tabular-nums'
            value={desde ?? ''}
            max={hasta}
            onChange={(evento) =>
              onCambiar({ desde: evento.target.value || undefined, hasta })
            }
          />
          <span className='text-muted-foreground shrink-0 text-xs'>a</span>
          <Input
            id={`${id}-hasta`}
            type='date'
            aria-label={`${etiqueta} hasta`}
            className='tabular-nums'
            value={hasta ?? ''}
            min={desde}
            onChange={(evento) =>
              onCambiar({ desde, hasta: evento.target.value || undefined })
            }
          />
        </div>
      </CampoDeFiltro>
    </div>
  )
}
