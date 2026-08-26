import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'

interface Props {
  titulo: string
  descripcion?: ReactNode
  acciones?: ReactNode
  children: ReactNode
  /**
   * Nivel del encabezado. El panel principal tiene `h1` de página, así que sus
   * secciones son `h2`; en informes hay un `h2` con el nombre del informe, así
   * que las tarjetas de adentro bajan a `h3`. Saltarse un nivel rompe la
   * navegación por encabezados de un lector de pantalla.
   */
  nivel?: 2 | 3
  /** Atenúa el contenido mientras se refresca, sin desmontarlo. */
  refrescando?: boolean
  className?: string
}

/**
 * Contenedor de una sección con datos.
 *
 * `refrescando` atenúa el contenido en lugar de reemplazarlo por un esqueleto.
 * Cuando alguien mueve el rango de fechas, los gráficos tienen que mantener su
 * marco: un esqueleto que aparece en cada cambio de filtro hace saltar la
 * página entera y se pierde el hilo de lo que se estaba mirando.
 */
export function TarjetaSeccion({
  titulo,
  descripcion,
  acciones,
  children,
  nivel = 2,
  refrescando = false,
  className,
}: Props) {
  // Encabezado real en vez del `div` que trae `CardTitle`: así la pantalla se
  // puede recorrer por encabezados.
  const Encabezado = nivel === 2 ? 'h2' : 'h3'

  return (
    <Card className={className}>
      <CardHeader>
        <Encabezado
          data-slot='card-title'
          className='leading-none font-semibold'
        >
          {titulo}
        </Encabezado>
        {descripcion && <CardDescription>{descripcion}</CardDescription>}
        {acciones && <CardAction>{acciones}</CardAction>}
      </CardHeader>
      <CardContent
        className={cn(
          'transition-opacity duration-200',
          refrescando && 'opacity-60',
        )}
        aria-busy={refrescando}
      >
        {children}
      </CardContent>
    </Card>
  )
}
