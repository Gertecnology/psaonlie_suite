import { cn } from '@/lib/utils'
import {
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
  formatearVariacion,
} from '@/lib/formato'
import {
  informePorRuta,
  type PeriodoInforme,
} from '../../models/informe.model'
import {
  FILAS_COMPARATIVO,
  type Comparativo,
  type Variacion,
} from '../../models/comparativo.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'
import { TablaContable, type ColumnaContable } from '../tabla-contable'

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
                valor: `${rangoEnLetras(data.periodoAnterior)} (${data.periodoAnterior.dias} días)`,
              },
            ]
          : undefined
      }
      isLoading={isLoading}
      error={error}
      onEmitir={generar}
      puedeEmitir={puedeGenerar}
      controles={
        <FiltrosInformeControles
          borrador={borrador}
          onCambiar={cambiar}
          extras={['comparativo']}
        />
      }
      resultado={data ? <Cuerpo datos={data} /> : undefined}
    />
  )
}

/** Una fila del comparativo: el concepto y la variación que la API le devolvió. */
interface FilaComparativa {
  clave: string
  etiqueta: string
  esMonto: boolean
  variacion: Variacion
}

function Cuerpo({ datos }: { datos: Comparativo }) {
  // Lista fija y no `Object.entries(variaciones)`: la API puede agregar claves,
  // y un informe que se agrega filas solo deja de ser el mismo documento de un
  // mes al otro.
  const filas: FilaComparativa[] = FILAS_COMPARATIVO.flatMap((fila) => {
    const variacion = datos.variaciones[fila.clave]
    return variacion ? [{ ...fila, variacion }] : []
  })

  const formatear = (fila: FilaComparativa, valor: number) =>
    fila.esMonto ? formatearGuaranies(valor) : formatearEntero(valor)

  const columnas: ColumnaContable<FilaComparativa>[] = [
    {
      clave: 'concepto',
      titulo: 'Concepto',
      alinear: 'izquierda',
      celda: (fila) => fila.etiqueta,
    },
    {
      clave: 'actual',
      titulo: 'Período actual',
      // Los dos períodos pueden no durar lo mismo, y comparar 30 días contra 7
      // sin decirlo hace parecer un derrumbe lo que es sólo una ventana más
      // corta. Las fechas van en el encabezado, que es donde se leen justo
      // cuando se comparan los números.
      unidad: rangoEnLetras(datos.periodoActual),
      ancho: 148,
      celda: (fila) => (
        <span className='font-semibold'>
          {formatear(fila, fila.variacion.actual)}
        </span>
      ),
    },
    {
      clave: 'anterior',
      titulo: 'Período anterior',
      unidad: rangoEnLetras(datos.periodoAnterior),
      ancho: 148,
      celda: (fila) => formatear(fila, fila.variacion.anterior),
    },
    {
      clave: 'diferencia',
      titulo: 'Diferencia',
      unidad: 'actual − anterior',
      ancho: 140,
      celda: (fila) => formatear(fila, fila.variacion.diferencia),
    },
    {
      clave: 'variacion',
      titulo: 'Variación',
      unidad: '%',
      ancho: 92,
      celda: (fila) => <CeldaVariacion variacion={fila.variacion.variacion} />,
    },
  ]

  // Sin fila de totales y sin `SON:` a propósito: las filas son conceptos
  // distintos —guaraníes, conteos y un promedio—, y sumar variaciones
  // porcentuales no da una cifra que alguien vaya a pagar.
  return (
    <TablaContable
      columnas={columnas}
      filas={filas}
      claveFila={(fila) => fila.clave}
      descripcion='Comparación de las cifras del período actual contra el anterior, con la diferencia y la variación de cada concepto'
      mensajeVacio='La API no devolvió ninguna cifra comparable para el período.'
    />
  )
}

/**
 * La variación del período, con el signo escrito.
 *
 * El color nunca es el único canal: en papel no se imprime y a quien no
 * distingue el rojo no le llega, así que `formatearVariacion` antepone `+` o
 * `−` y el verde o el rojo sólo lo acompañan.
 *
 * `null` no es cero: significa que el período anterior fue cero y el
 * crecimiento contra nada no está definido. Se escribe `—`, como cualquier
 * valor que no aplica.
 */
function CeldaVariacion({ variacion }: { variacion: number | null }) {
  if (variacion === null) {
    return <span className='text-muted-foreground'>—</span>
  }

  return (
    <span
      className={cn(
        variacion > 0 && 'font-semibold text-green-700 dark:text-green-500',
        variacion < 0 && 'text-destructive font-semibold',
        variacion === 0 && 'text-muted-foreground',
      )}
    >
      {formatearVariacion(variacion)}
    </span>
  )
}

/** `"2026-08-01 a 2026-08-31"`. */
function rangoEnLetras(periodo: PeriodoInforme): string {
  return `${formatearFechaISO(periodo.desde)} a ${formatearFechaISO(periodo.hasta)}`
}
