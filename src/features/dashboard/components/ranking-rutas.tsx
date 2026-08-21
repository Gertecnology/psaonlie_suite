import { useMemo } from 'react'
import { formatearEntero, formatearGuaranies } from '@/lib/formato'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { EstadisticasPorRuta } from '../models/estadisticas.model'
import { armarFilasRutas } from '../models/series.model'
import { EstadoVacio, SkeletonTabla } from './estados'

interface Props {
  rutas: EstadisticasPorRuta[] | undefined
  cargando: boolean
}

/**
 * Ranking por ruta.
 *
 * Una sola serie —el monto vendido— así que todas las barras llevan el mismo
 * color. Pintar cada barra de un tono distinto según su valor gastaría el canal
 * de identidad en repetir lo que el largo de la barra ya dice.
 *
 * Las barras son horizontales porque los nombres de las rutas son largos: en
 * columnas verticales las etiquetas se rotarían o se recortarían.
 */
export function RankingRutas({ rutas, cargando }: Props) {
  const filas = useMemo(() => armarFilasRutas(rutas ?? []), [rutas])

  if (cargando && !rutas) return <SkeletonTabla filas={6} />

  if (filas.length === 0) {
    return (
      <EstadoVacio
        titulo='Sin ventas por ruta'
        descripcion='No hay rutas con ventas en este período.'
      />
    )
  }

  const maximo = Math.max(...filas.map((f) => f.monto), 1)

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='min-w-[12rem]'>Ruta</TableHead>
            <TableHead className='w-[35%] min-w-[8rem]'>Vendido</TableHead>
            <TableHead className='text-end'>Ventas</TableHead>
            <TableHead className='text-end'>Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.clave}>
              <TableCell className='font-medium'>
                {fila.destino ? (
                  <span>
                    {fila.origen}{' '}
                    <span className='text-muted-foreground' aria-label='hacia'>
                      →
                    </span>{' '}
                    {fila.destino}
                  </span>
                ) : (
                  fila.origen
                )}
              </TableCell>
              <TableCell>
                <div
                  className='h-2.5 w-full'
                  role='img'
                  aria-label={formatearGuaranies(fila.monto)}
                >
                  <div
                    className='h-full rounded-e-full'
                    style={{
                      width: `${(fila.monto / maximo) * 100}%`,
                      backgroundColor: 'var(--chart-1)',
                    }}
                  />
                </div>
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearEntero(fila.cantidad)}
              </TableCell>
              <TableCell className='text-end font-medium tabular-nums'>
                {formatearGuaranies(fila.monto)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className='text-muted-foreground mt-3 text-xs'>
        El monto es el pasaje vendido, sin el cargo por servicio.
      </p>
    </div>
  )
}
