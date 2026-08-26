import type { ReactNode } from 'react'
import { IconAlertCircle, IconInbox } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * Los tres estados que toda vista con datos tiene que resolver.
 *
 * El estado vacío explica **qué falta**, no dice "no hay datos": la mitad de
 * las veces el período está bien y lo que falta es una venta, y la otra mitad
 * el filtro es demasiado angosto. Distinguirlo le ahorra al operador el paso de
 * dudar si la pantalla está rota.
 *
 * El estado de error muestra el `message` que devolvió el backend. "Something
 * went wrong" no le sirve a nadie: no dice si reintentar, si avisar, o si el
 * problema es de permisos.
 */

interface EstadoVacioProps {
  titulo: string
  descripcion: ReactNode
  accion?: ReactNode
  className?: string
}

export function EstadoVacio({
  titulo,
  descripcion,
  accion,
  className,
}: EstadoVacioProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className,
      )}
    >
      <IconInbox className='text-muted-foreground/60 size-8' aria-hidden />
      <p className='text-foreground text-sm font-medium'>{titulo}</p>
      <p className='text-muted-foreground max-w-prose text-sm leading-relaxed'>
        {descripcion}
      </p>
      {accion && <div className='mt-2'>{accion}</div>}
    </div>
  )
}

interface EstadoErrorProps {
  titulo?: string
  error: unknown
  onReintentar?: () => void
  className?: string
}

export function EstadoError({
  titulo = 'No se pudieron cargar los datos',
  error,
  onReintentar,
  className,
}: EstadoErrorProps) {
  const mensaje =
    error instanceof Error && error.message
      ? error.message
      : 'El servidor no devolvió un detalle del problema.'

  return (
    <div
      role='alert'
      className={cn(
        'border-border flex flex-col items-center justify-center gap-2 rounded-xl border px-6 py-12 text-center',
        'bg-[color-mix(in_oklab,var(--estado-critico)_6%,transparent)]',
        className,
      )}
    >
      <IconAlertCircle
        className='size-8 text-[var(--estado-critico)]'
        aria-hidden
      />
      <p className='text-foreground text-sm font-medium'>{titulo}</p>
      <p className='text-muted-foreground max-w-prose text-sm leading-relaxed'>
        {mensaje}
      </p>
      {onReintentar && (
        <Button
          variant='outline'
          size='sm'
          className='mt-2'
          onClick={onReintentar}
        >
          Reintentar
        </Button>
      )}
    </div>
  )
}

/** Esqueleto de una tarjeta de métrica. Misma silueta que la real. */
export function SkeletonMetrica() {
  return (
    <div className='border-border flex flex-col gap-3 rounded-xl border p-4'>
      <Skeleton className='h-3 w-24' />
      <Skeleton className='h-7 w-36' />
      <Skeleton className='h-3 w-20' />
    </div>
  )
}

/** Esqueleto de un gráfico, con el alto real para que nada se mueva después. */
export function SkeletonGrafico({ alto = 260 }: { alto?: number }) {
  return (
    <div className='space-y-3'>
      <Skeleton className='h-4 w-40' />
      <Skeleton className='w-full rounded-lg' style={{ height: alto }} />
    </div>
  )
}

/** Esqueleto de una tabla de `filas` renglones. */
export function SkeletonTabla({ filas = 5 }: { filas?: number }) {
  return (
    <div className='space-y-2'>
      {Array.from({ length: filas }).map((_, i) => (
        <Skeleton key={i} className='h-10 w-full' />
      ))}
    </div>
  )
}
