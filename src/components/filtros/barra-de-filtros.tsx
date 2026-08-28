import type { ReactNode } from 'react'
import { FilterX, Loader2, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Un filtro puesto, tal como se muestra en la fila de abajo. */
export interface FiltroAplicado {
  /** Identifica el filtro para poder sacarlo solo. */
  clave: string
  etiqueta: string
  /** Lo elegido, ya legible: «Expresso Paraguay», no un uuid. */
  valor: string
}

interface BarraDeFiltrosProps {
  children: ReactNode
  aplicados: FiltroAplicado[]
  onQuitar: (clave: string) => void
  onLimpiar: () => void
  /** Hay una consulta en vuelo con filtros que ya cambiaron. */
  actualizando?: boolean
  /** Cuántas filas coinciden, para poder decirlo al lado de los chips. */
  total?: number
  className?: string
}

/**
 * El encabezado de filtros de un listado.
 *
 * Dos partes: los controles arriba, y abajo lo que quedó aplicado.
 *
 * Esa segunda fila no es decoración. Con seis filtros posibles, varios de
 * ellos plegados o fuera de la vista, la única forma de saber por qué la tabla
 * muestra tres filas es que la pantalla lo diga. Un listado filtrado que se ve
 * igual que uno completo hace que alguien lea un total y crea que es el total.
 *
 * El aviso de «actualizando» aparece cuando la consulta ya salió pero todavía
 * se muestran los datos anteriores. Sin él, cambiar un filtro no produce
 * ninguna señal hasta que llega la respuesta, y la pantalla parece ignorar el
 * clic.
 */
export function BarraDeFiltros({
  children,
  aplicados,
  onQuitar,
  onLimpiar,
  actualizando = false,
  total,
  className,
}: BarraDeFiltrosProps) {
  return (
    <div className={cn('grid gap-3', className)}>
      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        {children}
      </div>

      {(aplicados.length > 0 || actualizando) && (
        <div className='flex flex-wrap items-center gap-2'>
          {actualizando && (
            <span
              className='text-muted-foreground flex items-center gap-1.5 text-xs'
              // Un cambio de filtro no mueve el foco, así que sin esto quien
              // usa lector de pantalla no se entera de que la tabla cambió.
              role='status'
            >
              <Loader2 className='h-3 w-3 animate-spin' />
              Actualizando…
            </span>
          )}

          {aplicados.map((filtro) => (
            <Badge
              key={filtro.clave}
              variant='secondary'
              className='gap-1 py-1 pl-2.5 pr-1 font-normal'
            >
              <span className='text-muted-foreground'>{filtro.etiqueta}:</span>
              <span className='font-medium'>{filtro.valor}</span>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                aria-label={`Quitar el filtro ${filtro.etiqueta}`}
                className='hover:bg-background/60 h-4 w-4 rounded-full'
                onClick={() => onQuitar(filtro.clave)}
              >
                <X className='h-3 w-3' />
              </Button>
            </Badge>
          ))}

          {aplicados.length > 0 && (
            <>
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='h-7 px-2 text-xs'
                onClick={onLimpiar}
              >
                <FilterX className='mr-1 h-3.5 w-3.5' />
                Limpiar filtros
              </Button>

              {total !== undefined && (
                <span className='text-muted-foreground ml-auto text-xs tabular-nums'>
                  {total} {total === 1 ? 'resultado' : 'resultados'}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
