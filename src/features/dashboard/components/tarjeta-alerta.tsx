import type { ReactNode } from 'react'
import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconExclamationCircleFilled,
  IconInfoCircleFilled,
} from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { SeveridadAlerta } from '../models/alertas.model'

const ICONOS: Record<SeveridadAlerta, typeof IconAlertTriangleFilled> = {
  critica: IconExclamationCircleFilled,
  seria: IconAlertTriangleFilled,
  atencion: IconInfoCircleFilled,
  ok: IconCircleCheckFilled,
}

/**
 * Cada severidad lleva ícono + texto además de color.
 *
 * En modo claro, `atencion` y `serio` quedan por debajo de 3:1 contra el fondo:
 * eso es esperable y por eso el color nunca viaja solo. El ícono y el título
 * son los que cargan el significado.
 */
const COLOR_ICONO: Record<SeveridadAlerta, string> = {
  critica: 'text-[var(--estado-critico)]',
  seria: 'text-[var(--estado-serio)]',
  atencion: 'text-[var(--estado-atencion)]',
  ok: 'text-[var(--estado-ok)]',
}

const FONDO: Record<SeveridadAlerta, string> = {
  critica: 'bg-[color-mix(in_oklab,var(--estado-critico)_8%,transparent)]',
  seria: 'bg-[color-mix(in_oklab,var(--estado-serio)_8%,transparent)]',
  atencion: 'bg-[color-mix(in_oklab,var(--estado-atencion)_10%,transparent)]',
  ok: 'bg-transparent',
}

const TEXTO_SEVERIDAD: Record<SeveridadAlerta, string> = {
  critica: 'Crítico',
  seria: 'Grave',
  atencion: 'Atención',
  ok: 'Sin novedades',
}

interface Props {
  severidad: SeveridadAlerta
  titulo: string
  /** Cifra principal. Ya viene formateada. */
  cifra: string
  /** Qué significa y qué hacer. Nunca "algo salió mal". */
  detalle: ReactNode
  /** Dato secundario: monto involucrado, alcance de la medición. */
  nota?: ReactNode
  accion?: ReactNode
}

/**
 * Tarjeta de alerta operativa.
 *
 * Sin franja de color al costado: el borde completo, el fondo teñido y el ícono
 * ya dicen la severidad, y una barrita lateral de 4px es la decoración más
 * repetida —y menos informativa— de los paneles administrativos.
 */
export function TarjetaAlerta({
  severidad,
  titulo,
  cifra,
  detalle,
  nota,
  accion,
}: Props) {
  const Icono = ICONOS[severidad]

  return (
    <article
      className={cn(
        'border-border flex flex-col gap-3 rounded-xl border p-4',
        FONDO[severidad],
      )}
    >
      <header className='flex items-start gap-2.5'>
        <Icono
          className={cn('mt-0.5 size-5 shrink-0', COLOR_ICONO[severidad])}
          aria-hidden
        />
        <div className='min-w-0 flex-1'>
          <p className='text-foreground text-sm leading-tight font-medium'>
            {titulo}
          </p>
          <p className='sr-only'>Severidad: {TEXTO_SEVERIDAD[severidad]}</p>
        </div>
      </header>

      <p className='text-foreground text-3xl leading-none font-semibold'>
        {cifra}
      </p>

      <div className='text-muted-foreground space-y-1 text-xs leading-relaxed'>
        <p>{detalle}</p>
        {nota && <p className='opacity-80'>{nota}</p>}
      </div>

      {accion && <div className='mt-auto pt-1'>{accion}</div>}
    </article>
  )
}

/** Esqueleto con la misma silueta, para que nada salte al cargar. */
export function TarjetaAlertaSkeleton() {
  return (
    <div className='border-border flex flex-col gap-3 rounded-xl border p-4'>
      <div className='flex items-center gap-2.5'>
        <Skeleton className='size-5 rounded-full' />
        <Skeleton className='h-4 w-40' />
      </div>
      <Skeleton className='h-8 w-24' />
      <Skeleton className='h-3 w-full' />
      <Skeleton className='h-3 w-2/3' />
    </div>
  )
}
