import { useState } from 'react'
import { IconCalendar, IconCheck } from '@tabler/icons-react'
import type { DateRange } from 'react-day-picker'
import {
  ETIQUETAS_PRESET,
  PRESETS_VISIBLES,
  describirPeriodo,
  type Periodo,
  type PresetPeriodo,
} from '@/lib/periodo'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

interface Props {
  preset: PresetPeriodo
  periodo: Periodo
  onPreset: (preset: PresetPeriodo) => void
  onRango: (desde: Date, hasta: Date) => void
}

/**
 * Selector de rango de fechas del panel.
 *
 * Los presets van primero y como filas, no como un calendario: nadie quiere
 * pelearse con una grilla de días para decir "últimos 30". El rango a medida
 * queda detrás de una línea, al final, para quien de verdad lo necesita.
 *
 * Navegable con teclado de punta a punta: el disparador es un botón, las filas
 * son botones, y el popover de Radix ya devuelve el foco al cerrarse.
 */
export function SelectorRangoFechas({
  preset,
  periodo,
  onPreset,
  onRango,
}: Props) {
  const [abierto, setAbierto] = useState(false)
  const [rangoParcial, setRangoParcial] = useState<DateRange | undefined>()

  const elegirPreset = (nuevo: PresetPeriodo) => {
    setRangoParcial(undefined)
    onPreset(nuevo)
    setAbierto(false)
  }

  const elegirRango = (rango: DateRange | undefined) => {
    setRangoParcial(rango)
    if (rango?.from && rango.to) {
      onRango(rango.from, rango.to)
      setAbierto(false)
      setRangoParcial(undefined)
    }
  }

  const etiqueta =
    preset === 'personalizado'
      ? describirPeriodo(periodo)
      : ETIQUETAS_PRESET[preset]

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='justify-start gap-2 font-normal'
          aria-label={`Cambiar período. Actual: ${describirPeriodo(periodo)}`}
        >
          <IconCalendar className='size-4 shrink-0' aria-hidden />
          <span className='truncate'>{etiqueta}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-auto p-0' align='start'>
        <div className='flex flex-col p-1' role='group' aria-label='Períodos'>
          {PRESETS_VISIBLES.map((opcion) => {
            const activo = opcion === preset
            return (
              <button
                key={opcion}
                type='button'
                onClick={() => elegirPreset(opcion)}
                aria-pressed={activo}
                className={cn(
                  'flex items-center justify-between gap-6 rounded-md px-3 py-1.5 text-start text-sm',
                  'hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                  activo && 'font-medium',
                )}
              >
                {ETIQUETAS_PRESET[opcion]}
                {activo && (
                  <IconCheck className='size-4 shrink-0' aria-hidden />
                )}
              </button>
            )
          })}
        </div>

        <Separator />

        <div className='p-1'>
          <p className='text-muted-foreground px-3 pt-2 pb-1 text-xs'>
            Rango a medida
          </p>
          <Calendar
            mode='range'
            numberOfMonths={1}
            defaultMonth={periodo.desde}
            selected={
              rangoParcial ?? { from: periodo.desde, to: periodo.hasta }
            }
            onSelect={elegirRango}
            disabled={{ after: new Date() }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
