import * as React from 'react'
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table'
import { formatearFechaISO, formatearGuaranies } from '@/lib/formato'
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
  return (
    <div className='space-y-4'>
      {/* Sin cartel de advertencia ni resumen por tipo: la tabla ES la lista de
          lo que hay que revisar, y cada fila dice qué le pasa. */}
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
