import { Ban, Check, Circle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEAT_STATE_CLASSES } from './seat-states'

/**
 * Las muestras usan exactamente las mismas clases que la grilla
 * (`SEAT_STATE_CLASSES`), así la leyenda y el mapa de asientos no pueden
 * desincronizarse. Cada entrada lleva ícono y texto: el color nunca es el
 * único canal.
 */
const legendItems = [
  {
    classes: SEAT_STATE_CLASSES.libre,
    Icon: Circle,
    label: 'Disponible',
    description: 'Asiento disponible',
  },
  {
    classes: SEAT_STATE_CLASSES.seleccionado,
    Icon: Check,
    label: 'Seleccionado',
    description: 'Asiento seleccionado',
  },
  {
    classes: SEAT_STATE_CLASSES.bloqueado,
    Icon: Lock,
    label: 'Bloqueado',
    description: 'Asiento confirmado',
  },
  {
    classes: SEAT_STATE_CLASSES.ocupado,
    Icon: Ban,
    label: 'Ocupado',
    description: 'Asiento no disponible',
  },
]

export function SeatLegend() {
  return (
    <div className='space-y-3'>
      <h4 className='text-center text-sm font-medium'>Leyenda de Asientos</h4>
      <div className='grid grid-cols-2 gap-3 text-xs md:grid-cols-4'>
        {legendItems.map(({ classes, Icon, label, description }) => (
          <div key={label} className='flex items-center gap-2'>
            <div
              className={cn('h-4 w-4 flex-shrink-0 rounded border-2', classes)}
            />
            <Icon
              className='text-muted-foreground h-3.5 w-3.5 shrink-0'
              aria-hidden='true'
            />
            <div>
              <p className='font-medium'>{label}</p>
              <p className='text-muted-foreground text-xs'>{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
