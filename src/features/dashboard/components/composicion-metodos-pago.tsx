import { useMemo } from 'react'
import type { EstadisticasPorMetodoPago } from '../models/estadisticas.model'
import { armarSegmentosMetodos } from '../models/series.model'
import { EstadoVacio, SkeletonGrafico } from './estados'
import { TiraComposicion } from './tira-composicion'

interface Props {
  metodos: EstadisticasPorMetodoPago[] | undefined
  cargando: boolean
}

/**
 * Cómo se reparten las ventas entre los métodos de pago.
 *
 * Es una composición de un total, así que va como una sola tira apilada y no
 * como cuatro barras sueltas: la pregunta es "qué proporción", no "cuál es más
 * alta".
 */
export function ComposicionMetodosPago({ metodos, cargando }: Props) {
  const segmentos = useMemo(
    () => armarSegmentosMetodos(metodos ?? []),
    [metodos],
  )

  if (cargando && !metodos) return <SkeletonGrafico alto={80} />

  if (segmentos.length === 0) {
    return (
      <EstadoVacio
        titulo='Sin ventas por método de pago'
        descripcion='No se registraron ventas en este período, así que no hay métodos de pago que comparar.'
      />
    )
  }

  const total = segmentos.reduce((acc, s) => acc + s.monto, 0)

  return (
    <div>
      <TiraComposicion total={total} segmentos={segmentos} />
      <p className='text-muted-foreground mt-3 text-xs'>
        Montos de pasaje vendido, sin el cargo por servicio.
      </p>
    </div>
  )
}
