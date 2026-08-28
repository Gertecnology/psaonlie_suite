import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/** Los tamaños que se ofrecen. El tope lo pone la API en 100. */
const TAMANOS = [25, 50, 100]

interface PaginacionProps {
  pagina: number
  tamano: number
  /** Cuántas filas hay en total con los filtros puestos. */
  total: number
  onPagina: (pagina: number) => void
  onTamano?: (tamano: number) => void
  /** Deshabilita los botones mientras la página nueva viaja. */
  cargando?: boolean
  className?: string
}

/**
 * La paginación de un listado servido por el backend.
 *
 * Dice **qué se está viendo**, no sólo en qué página se está: «1–25 de 137».
 * Con el número de página solo, nadie sabe cuántas filas quedan sin mirar, y
 * en un listado de dinero esa cuenta es la diferencia entre revisar todo y
 * creer que se revisó todo.
 *
 * Se dibuja aunque haya una sola página, siempre que haya filas. Que aparezca
 * y desaparezca según el filtro hace saltar la tabla, y esconder el total
 * cuando entra en una página es esconderlo justo cuando es más fácil de leer.
 */
export function Paginacion({
  pagina,
  tamano,
  total,
  onPagina,
  onTamano,
  cargando = false,
  className,
}: PaginacionProps) {
  if (total === 0) return null

  const paginas = Math.max(1, Math.ceil(total / tamano))
  const primera = (pagina - 1) * tamano + 1
  const ultima = Math.min(pagina * tamano, total)

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 text-sm',
        className,
      )}
    >
      <span className='text-muted-foreground tabular-nums'>
        {primera}–{ultima} de {total}
      </span>

      <div className='flex items-center gap-2'>
        {onTamano && (
          <div className='flex items-center gap-1.5'>
            <span className='text-muted-foreground text-xs'>Por página</span>
            <Select
              value={String(tamano)}
              onValueChange={(valor) => onTamano(Number(valor))}
            >
              <SelectTrigger
                className='h-8 w-[4.5rem]'
                aria-label='Filas por página'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TAMANOS.map((opcion) => (
                  <SelectItem key={opcion} value={String(opcion)}>
                    {opcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <span className='text-muted-foreground tabular-nums'>
          Página {pagina} de {paginas}
        </span>

        <Button
          variant='outline'
          size='sm'
          aria-label='Página anterior'
          disabled={pagina <= 1 || cargando}
          onClick={() => onPagina(pagina - 1)}
        >
          <ChevronLeft className='h-4 w-4' />
          Anterior
        </Button>
        <Button
          variant='outline'
          size='sm'
          aria-label='Página siguiente'
          disabled={pagina >= paginas || cargando}
          onClick={() => onPagina(pagina + 1)}
        >
          Siguiente
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>
    </div>
  )
}
