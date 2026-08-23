import * as React from 'react'
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import {
  formatearEntero,
  formatearFechaISO,
  formatearGuaranies,
} from '@/lib/formato'
import { DataTable, useTablaServidor } from '@/components/data-table'
import {
  informePorRuta,
  rutaApi,
  type FiltrosInforme,
} from '../../models/informe.model'
import {
  claveAnomalia,
  etiquetaAnomalia,
  type Anomalia,
  type InformeAnomalias as DatosAnomalias,
} from '../../models/anomalias.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { exportarInformes } from '../../services/informes.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('anomalias')!

/**
 * Sales whose own figures contradict each other.
 *
 * This is not a list of things to review some day: every row here is already
 * being counted by the other reports. A commission larger than its fare is
 * inside the saldo some company gets transferred, and the saldo report has no
 * way to say so. Reading this one first is what makes the rest trustworthy.
 */
export function InformeAnomalias() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()
  const { pagination, onPaginationChange } = useTablaServidor()

  // La página y el tamaño viajan SIEMPRE explícitos: sin ellos el servidor
  // aplica su límite por defecto (25) mientras la tabla sigue diciendo 10 por
  // página, y el pie contradice a la grilla.
  const filtros = React.useMemo<FiltrosInforme>(
    () => ({
      ...aplicados,
      pagina: pagination.pageIndex + 1,
      tamano: pagination.pageSize,
    }),
    [aplicados, pagination],
  )

  const { data, isLoading, isFetching, error } = useInforme<DatosAnomalias>(
    rutaApi(DEFINICION),
    filtros,
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={filtros}
      periodo={data?.periodo}
      isLoading={isLoading}
      error={error}
      onGenerar={generar}
      onExportar={() => void exportarInformes(aplicados)}
      puedeGenerar={puedeGenerar}
      resultado={
        data ? (
          <Cuerpo
            datos={data}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            isFetching={isFetching}
          />
        ) : undefined
      }
    >
      <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
    </MarcoInforme>
  )
}

function Cuerpo({
  datos,
  pagination,
  onPaginationChange,
  isFetching,
}: {
  datos: DatosAnomalias
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  isFetching: boolean
}) {
  // `resumen` es del período completo; ordenarlo por cantidad pone arriba lo
  // que más se repite, que es por donde conviene empezar a mirar.
  const porTipo = Object.entries(datos.resumen).sort(
    ([, unaCantidad], [, otraCantidad]) => otraCantidad - unaCantidad,
  )

  return (
    <div className='space-y-6'>
      {datos.total > 0 && (
        <div
          role='alert'
          className='border-destructive/50 text-destructive flex items-start gap-3 rounded-md border p-4'
        >
          <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0' />
          <div className='text-sm'>
            <p className='font-medium'>
              {formatearEntero(datos.total)} ventas del período no se sostienen
              consigo mismas
            </p>
            <p className='mt-1'>
              Sus importes y comisiones se contradicen, y aun así entran en los
              demás informes: una comisión mal calculada ya está sumada en el
              saldo que se le transfiere a la empresa. Hasta resolverlas, las
              cifras de los otros informes arrastran estas filas.
            </p>
          </div>
        </div>
      )}

      {porTipo.length > 0 && (
        <section>
          <h3 className='mb-2 font-semibold'>Anomalías por tipo</h3>
          <table className='w-full max-w-xl text-sm'>
            <caption className='sr-only'>
              Cantidad de anomalías de cada tipo en todo el período
            </caption>
            <thead>
              <tr className='border-b text-left'>
                <th scope='col' className='py-2'>
                  Tipo
                </th>
                <th scope='col' className='py-2 text-right' data-tipo='monto'>
                  Ventas
                  <span className='text-muted-foreground block text-xs font-normal'>
                    en todo el período
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {porTipo.map(([tipo, cantidad]) => (
                <tr key={tipo} className='border-b last:border-0'>
                  <th scope='row' className='py-2 text-left font-normal'>
                    {etiquetaAnomalia(tipo)}
                  </th>
                  <td
                    className='py-2 text-right tabular-nums'
                    data-tipo='monto'
                  >
                    {formatearEntero(cantidad)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className='text-muted-foreground mt-2 max-w-prose text-xs'>
            Una misma venta puede aparecer en más de un tipo, así que la suma de
            esta columna no tiene por qué coincidir con el total de filas.
          </p>
        </section>
      )}

      <section className='space-y-2'>
        <DataTable
          columns={COLUMNAS}
          data={datos.data}
          // Una venta puede fallar varios controles y volver como varias filas:
          // la clave tiene que incluir el tipo o dos filas compartirían clave.
          getRowId={claveAnomalia}
          pageCount={datos.totalPages}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          isFetching={isFetching}
          caption='Ventas del período cuyos importes y comisiones no se sostienen entre sí, con el detalle de cada inconsistencia'
          emptyMessage='El período no tiene anomalías. Es el resultado que se busca.'
        />
        <p className='text-muted-foreground text-xs'>
          La grilla no lleva fila de totales: sumar comisiones que ya se saben
          mal calculadas daría una cifra sin significado. La comisión esperada
          es la que corresponde según el snapshot que la venta guardó al
          cobrarse.
        </p>
      </section>
    </div>
  )
}

/** Right-aligned figure column: `data-tipo` is what the print sheet keys on. */
const MONTO = {
  className: 'text-right tabular-nums',
  tipo: 'monto',
} as const

const COLUMNAS: ColumnDef<Anomalia, unknown>[] = [
  {
    id: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => (
      <span className='text-destructive font-medium'>
        {etiquetaAnomalia(row.original.tipo)}
      </span>
    ),
  },
  {
    id: 'venta',
    header: 'Venta',
    cell: ({ row }) => (
      <>
        <span className='font-medium'>{row.original.numeroTransaccion}</span>
        <span className='text-muted-foreground block text-xs'>
          {row.original.estadoPago}
        </span>
      </>
    ),
  },
  {
    id: 'empresa',
    header: 'Empresa',
    cell: ({ row }) => row.original.empresaNombre,
  },
  {
    id: 'fecha-venta',
    header: 'Fecha de venta',
    meta: { unidad: 'AAAA-MM-DD', className: 'tabular-nums' },
    cell: ({ row }) => formatearFechaISO(row.original.fechaVenta),
  },
  {
    id: 'pasaje',
    header: 'Pasaje',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.pasaje),
  },
  {
    id: 'comision',
    header: 'Comisión registrada',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.comision),
  },
  {
    id: 'comision-esperada',
    header: 'Comisión esperada',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.comisionEsperada),
  },
  {
    id: 'detalle',
    header: 'Detalle',
    // Es la explicación del backend, no una interpretación del panel: reescribirla
    // acá haría que la pantalla y el informe exportado dijeran cosas distintas.
    meta: { className: 'max-w-xs text-xs' },
    cell: ({ row }) => row.original.detalle,
  },
]
