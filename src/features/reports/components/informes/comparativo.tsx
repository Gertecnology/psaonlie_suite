import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
  formatearVariacion,
} from '@/lib/formato'
import { informePorRuta } from '../../models/informe.model'
import {
  FILAS_COMPARATIVO,
  type Comparativo,
  type Variacion,
} from '../../models/comparativo.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('comparativo')!

/**
 * Two periods, enfrentados.
 *
 * The old version fired two queries of its own and derived the comparison in
 * the browser. The backend already does it in one call, and — more to the
 * point — it distinguishes "did not grow" from "there was nothing to compare
 * against" by returning `null` instead of 0%. Computed in the panel, both came
 * out as zero and read the same.
 *
 * If no comparison period is given the API uses the block immediately before,
 * of the same length; that is why the header states both periods explicitly.
 */
export function InformeComparativo() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()

  const { data, isLoading, error } = useInforme<Comparativo>(
    DEFINICION.ruta,
    aplicados,
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={aplicados}
      periodo={data?.periodoActual}
      filtrosDescritos={
        data
          ? [
              {
                etiqueta: 'Comparado contra',
                valor: `${formatearFechaISO(data.periodoAnterior.desde)} a ${formatearFechaISO(data.periodoAnterior.hasta)} (${data.periodoAnterior.dias} días)`,
              },
            ]
          : undefined
      }
      isLoading={isLoading}
      error={error}
      onGenerar={generar}
      puedeGenerar={puedeGenerar}
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    >
      <FiltrosInformeControles
        borrador={borrador}
        onCambiar={cambiar}
        extras={['comparativo']}
      />
    </MarcoInforme>
  )
}

function Cuerpo({ datos }: { datos: Comparativo }) {
  // Los dos períodos pueden tener distinta duración: comparar 30 días contra 7
  // sin decirlo hace parecer un derrumbe lo que es sólo una ventana más corta.
  const duracionDistinta = datos.periodoActual.dias !== datos.periodoAnterior.dias

  return (
    <div className='space-y-4'>
      {/* Que los períodos no duren lo mismo se dice en el encabezado de cada
          columna —"30 días" contra "7 días"—, no en un cartel arriba: ahí se
          lee justo cuando se comparan los números. */}
      <table className='w-full text-sm'>
        <caption className='sr-only'>
          Comparación de las cifras del período actual contra el anterior
        </caption>
        <thead>
          <tr className='border-b text-left'>
            <th scope='col' className='py-2'>
              Concepto
            </th>
            <th scope='col' className='py-2 text-right'>
              Actual
              {duracionDistinta && (
                <span className='text-muted-foreground block text-xs font-normal'>
                  {datos.periodoActual.dias} días
                </span>
              )}
            </th>
            <th scope='col' className='py-2 text-right'>
              Anterior
              {duracionDistinta && (
                <span className='text-muted-foreground block text-xs font-normal'>
                  {datos.periodoAnterior.dias} días
                </span>
              )}
            </th>
            <th scope='col' className='py-2 text-right'>
              Diferencia
            </th>
            <th scope='col' className='py-2 text-right'>
              Variación
            </th>
          </tr>
        </thead>
        <tbody>
          {FILAS_COMPARATIVO.map((fila) => {
            const variacion = datos.variaciones[fila.clave]
            if (!variacion) return null

            const formatear = fila.esMonto ? formatearGuaranies : formatearEntero

            return (
              <tr key={fila.clave} className='border-b last:border-0'>
                <th scope='row' className='py-2 text-left font-normal'>
                  {fila.etiqueta}
                  <span className='text-muted-foreground ml-2 text-xs'>
                    {fila.esMonto ? 'PYG' : 'unidades'}
                  </span>
                </th>
                <td className='py-2 text-right font-medium tabular-nums' data-tipo='monto'>
                  {formatear(variacion.actual)}
                </td>
                <td className='text-muted-foreground py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatear(variacion.anterior)}
                </td>
                <td className='py-2 text-right tabular-nums' data-tipo='monto'>
                  {formatear(variacion.diferencia)}
                </td>
                <td className='py-2 text-right'>
                  <Flecha variacion={variacion} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Flecha({ variacion }: { variacion: Variacion }) {
  // `null` no es cero: significa que el período anterior fue cero y el
  // crecimiento contra nada no está definido. Decirlo es más honesto que
  // dibujar una flecha hacia arriba con un número inventado.
  if (variacion.variacion === null) {
    return (
      <span className='text-muted-foreground inline-flex items-center gap-1 text-xs'>
        <Minus className='h-3 w-3' />
        Sin base
      </span>
    )
  }

  const subio = variacion.variacion > 0
  const igual = variacion.variacion === 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 tabular-nums',
        igual && 'text-muted-foreground',
        !igual && subio && 'text-green-700 dark:text-green-500',
        !igual && !subio && 'text-destructive',
      )}
    >
      {igual ? (
        <Minus className='h-3 w-3' />
      ) : subio ? (
        <ArrowUp className='h-3 w-3' />
      ) : (
        <ArrowDown className='h-3 w-3' />
      )}
      {formatearVariacion(variacion.variacion)}
    </span>
  )
}
