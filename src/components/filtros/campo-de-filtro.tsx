import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CampoDeFiltroProps {
  etiqueta: string
  /** El id del control, para que la etiqueta lo señale de verdad. */
  htmlFor: string
  children: ReactNode
  className?: string
}

/**
 * La envoltura de un filtro: su etiqueta arriba y el control abajo.
 *
 * La etiqueta se dibuja siempre, no como `placeholder`. Un placeholder
 * desaparece justo cuando el campo tiene contenido, que es el momento en que
 * hace falta saber qué significa ese contenido: una pantalla con seis filtros
 * aplicados y ninguna etiqueta visible obliga a abrir cada uno para recordar
 * qué era.
 */
export function CampoDeFiltro({
  etiqueta,
  htmlFor,
  children,
  className,
}: CampoDeFiltroProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label
        htmlFor={htmlFor}
        className='text-muted-foreground text-xs font-medium'
      >
        {etiqueta}
      </Label>
      {children}
    </div>
  )
}
