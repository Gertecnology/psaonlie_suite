import { IconCalendarPlus, IconFilterOff } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import type { EstadoFiltrosPanel } from '../hooks/use-filtros-panel'

interface Props {
  filtros: EstadoFiltrosPanel
}

/**
 * El estado "día tranquilo" del panel.
 *
 * Sin este bloque, un período sin ventas apilaba seis métricas en Gs. 0,
 * tres gráficos vacíos y una tabla vacía: la pantalla de un sistema roto.
 * Con él, el cero se dice una sola vez y la pantalla redirige la atención
 * a lo que sí importa en un día sin movimiento —las alertas de arriba—
 * o a ampliar el rango si lo que se busca es historia.
 */
export function PeriodoSinMovimiento({ filtros }: Props) {
  return (
    <section aria-label='Período sin movimiento' className='mb-8'>
      <div className='border-border bg-card rounded-xl border p-6'>
        <h2 className='text-lg font-semibold'>Período sin movimiento</h2>
        <p className='text-muted-foreground mt-1 max-w-prose text-sm leading-relaxed'>
          No hubo ventas ni cobros en el rango elegido, así que no hay plata que
          desglosar. Las alertas de arriba siguen activas: en un día tranquilo
          son lo único que exige acción.
        </p>
        <div className='mt-4 flex flex-wrap gap-2'>
          {filtros.preset !== '90d' && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => filtros.aplicarPreset('90d')}
            >
              <IconCalendarPlus className='size-4' aria-hidden />
              Ampliar a 90 días
            </Button>
          )}
          {filtros.preset !== 'anio' && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => filtros.aplicarPreset('anio')}
            >
              <IconCalendarPlus className='size-4' aria-hidden />
              Ver este año
            </Button>
          )}
          {filtros.agenciaId && (
            <Button
              variant='outline'
              size='sm'
              onClick={() => filtros.aplicarAgencia(undefined)}
            >
              <IconFilterOff className='size-4' aria-hidden />
              Sacar el filtro de empresa
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}
