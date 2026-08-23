import * as React from 'react'
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table'
import {
  formatearEntero,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { DataTable, useTablaServidor } from '@/components/data-table'
import {
  informePorRuta,
  rutaApi,
  type FiltrosInforme,
} from '../../models/informe.model'
import {
  claveRuta,
  type FilaRuta,
  type InformePorRuta as DatosPorRuta,
} from '../../models/por-ruta.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { exportarInformes } from '../../services/informes.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('por-ruta')!

/**
 * Which origin-destination pairs move the money.
 *
 * `tarifaPromedio` is the figure that makes this report worth more than a
 * ranking by volume: two routes can sell the same amount, one of them with
 * three times the tickets at a third of the price, and only the average fare
 * tells them apart.
 *
 * The API accepts `origenId` and `destinoId`, but the shared filter controls
 * offer no stop selector — the extras they know about are `metodoPago`,
 * `agruparPor` and `comparativo`. So this screen exposes period and company
 * only. Adding the pair would mean a stops endpoint and two more selects, which
 * is a change to the shared control and not to this report.
 */
export function InformePorRuta() {
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

  const { data, isLoading, isFetching, error } = useInforme<DatosPorRuta>(
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

/**
 * The report is its table.
 *
 * Two figure cards used to stand above it — routes in the period, routes on
 * this page — and a paragraph underneath explained why there is no totals row.
 * The pager already states which page of how many this is, and the missing
 * totals row needs no defence: the API sends no period totals, so there is
 * nothing honest to put in a footer and none is rendered. `participacion` is
 * the one period-wide figure per row, and its own header says so.
 */
function Cuerpo({
  datos,
  pagination,
  onPaginationChange,
  isFetching,
}: {
  datos: DatosPorRuta
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  isFetching: boolean
}) {
  return (
    <DataTable
      columns={COLUMNAS}
      data={datos.data}
      getRowId={claveRuta}
      pageCount={datos.totalPages}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      isFetching={isFetching}
      caption='Ventas, boletos, importe y tarifa promedio de cada par origen-destino del período'
      emptyMessage='El período no tiene ventas liquidables en ninguna ruta.'
    />
  )
}

/** Right-aligned figure column: `data-tipo` is what the print sheet keys on. */
const MONTO = {
  className: 'text-right tabular-nums',
  tipo: 'monto',
} as const

const COLUMNAS: ColumnDef<FilaRuta, unknown>[] = [
  {
    id: 'ruta',
    header: 'Ruta',
    cell: ({ row }) => (
      <span className='font-medium'>
        {row.original.origenNombre}
        <span aria-hidden='true'> → </span>
        <span className='sr-only'> hacia </span>
        {row.original.destinoNombre}
      </span>
    ),
  },
  {
    id: 'ventas',
    header: 'Ventas',
    meta: { ...MONTO, unidad: 'ventas' },
    cell: ({ row }) => formatearEntero(row.original.ventasLiquidables),
  },
  {
    id: 'boletos',
    header: 'Boletos vigentes',
    meta: { ...MONTO, unidad: 'boletos' },
    cell: ({ row }) => formatearEntero(row.original.boletosVigentes),
  },
  {
    id: 'pasajes',
    header: 'Pasajes',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.pasajes),
  },
  {
    id: 'tarifa-promedio',
    header: 'Tarifa promedio',
    meta: { ...MONTO, unidad: 'PYG por boleto' },
    cell: ({ row }) => formatearGuaranies(row.original.tarifaPromedio),
  },
  {
    id: 'cargo-servicio',
    header: 'Cargo por servicio',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.cargoServicio),
  },
  {
    id: 'comision',
    header: 'Comisión',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.comision),
  },
  {
    id: 'ingreso-propio',
    header: 'Ingreso propio',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.ingresoPropio),
  },
  {
    id: 'participacion',
    header: 'Participación',
    meta: { ...MONTO, unidad: '% del período' },
    cell: ({ row }) => formatearPorcentaje(row.original.participacion),
  },
]
