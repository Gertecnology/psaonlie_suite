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
  /**
   * Un filtro que la pantalla pone sola y no se puede sacar de a uno, como el
   * período con el que abre. Se muestra igual —para que nadie lea los totales
   * creyendo que son de toda la historia— pero sin la cruz.
   */
  fijo?: boolean
}

interface BarraDeFiltrosProps {
  children: ReactNode
  aplicados: FiltroAplicado[]
  onQuitar: (clave: string) => void
  onLimpiar: () => void
  /** Hay una consulta en vuelo con filtros que ya cambiaron. */
  actualizando?: boolean
  className?: string
}

/**
 * El encabezado de filtros de un listado.
 *
 * Los controles van en **una sola línea**, con el ancho que necesita cada uno
 * y no repartidos en columnas iguales: la búsqueda se estira, un desplegable
 * de dos opciones no tiene por qué medir lo mismo. En pantallas angostas la
 * fila se dobla sola.
 *
 * Debajo, lo que quedó aplicado. Esa fila no es decoración: con ocho filtros
 * posibles, la única forma de saber por qué la tabla muestra tres filas es que
 * la pantalla lo diga. Un listado filtrado que se ve igual que uno completo
 * hace que alguien lea un total y crea que es el total.
 *
 * «Limpiar filtros» se dibuja siempre que haya algo aplicado, **incluido lo
 * que la pantalla puso sola**. Un botón que aparece y desaparece obliga a
 * buscarlo, y el caso en que más falta hace —entrar y encontrar un período ya
 * acotado— es justamente aquel en que nadie tocó nada todavía.
 */
export function BarraDeFiltros({
  children,
  aplicados,
  onQuitar,
  onLimpiar,
  actualizando = false,
  className,
}: BarraDeFiltrosProps) {
  const hayQueLimpiar = aplicados.some((filtro) => !filtro.fijo)

  return (
    <div className={cn('grid gap-2', className)}>
      <div className='flex flex-wrap items-center gap-2'>{children}</div>

      {aplicados.length > 0 && (
        <div className='flex flex-wrap items-center gap-1.5'>
          {aplicados.map((filtro) => (
            <Badge
              key={filtro.clave}
              variant='secondary'
              className={cn(
                'h-6 gap-1 py-0 font-normal',
                filtro.fijo ? 'px-2.5' : 'pl-2.5 pr-1',
              )}
            >
              <span className='text-muted-foreground'>{filtro.etiqueta}:</span>
              <span className='font-medium'>{filtro.valor}</span>
              {!filtro.fijo && (
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
              )}
            </Badge>
          ))}

          {hayQueLimpiar && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='h-6 px-2 text-xs'
              onClick={onLimpiar}
            >
              <FilterX className='mr-1 h-3.5 w-3.5' />
              Limpiar filtros
            </Button>
          )}

          {actualizando && (
            <span
              className='text-muted-foreground ml-auto flex items-center gap-1 text-xs'
              // Un cambio de filtro no mueve el foco: sin esto, quien usa
              // lector de pantalla no se entera de que la tabla cambió.
              role='status'
            >
              <Loader2 className='h-3 w-3 animate-spin' />
              Actualizando…
            </span>
          )}
        </div>
      )}
    </div>
  )
}
