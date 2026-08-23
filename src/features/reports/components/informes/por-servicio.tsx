import * as React from 'react'
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table'
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
import type {
  FilaServicio,
  InformePorServicio as DatosPorServicio,
} from '../../models/por-servicio.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { exportarInformes } from '../../services/informes.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('por-servicio')!

/**
 * What gets sold, service by service.
 *
 * The two date columns are the reason to read it: `primerViaje` and
 * `ultimoViaje` are the trips sold, not the sales. A service whose last sold
 * trip is already behind us has an empty calendar ahead, and no amount column
 * shows that — it shows the opposite, a healthy total from trips that already
 * ran.
 */
export function InformePorServicio() {
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

  const { data, isLoading, isFetching, error } = useInforme<DatosPorServicio>(
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
 * The two counters that stood above it repeated the pager, and the note
 * underneath carried two sentences that belonged in the grid: that the dates
 * are the trip's and not the sale's — now said by the column headers
 * themselves — and an apology for the absent totals row, which needs none. The
 * API sends no period totals, so the table carries no footer.
 */
function Cuerpo({
  datos,
  pagination,
  onPaginationChange,
  isFetching,
}: {
  datos: DatosPorServicio
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  isFetching: boolean
}) {
  return (
    <DataTable
      columns={COLUMNAS}
      data={datos.data}
      getRowId={(fila) => fila.servicioId}
      pageCount={datos.totalPages}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      isFetching={isFetching}
      caption='Ventas, boletos e importes de cada servicio del período, con el primer y el último viaje vendidos'
      emptyMessage='El período no tiene ventas liquidables en ningún servicio.'
    />
  )
}

/** Right-aligned figure column: `data-tipo` is what the print sheet keys on. */
const MONTO = {
  className: 'text-right tabular-nums',
  tipo: 'monto',
} as const

const COLUMNAS: ColumnDef<FilaServicio, unknown>[] = [
  {
    id: 'empresa',
    header: 'Empresa',
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.empresaNombre}</span>
    ),
  },
  {
    id: 'calidad',
    header: 'Calidad',
    cell: ({ row }) =>
      row.original.calidad ?? (
        <span className='text-muted-foreground'>Sin declarar</span>
      ),
  },
  {
    id: 'servicio',
    header: 'Servicio',
    meta: { className: 'font-mono text-xs' },
    // La API no manda nombre de servicio, sólo el id. Se muestra tal cual: es
    // lo único que distingue dos servicios de la misma empresa y calidad, y
    // fabricar una etiqueta con esos dos campos los volvería indistinguibles.
    cell: ({ row }) => row.original.servicioId,
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
    id: 'primer-viaje',
    // "Vendido" va en el encabezado y no en una nota al pie de la tabla: la
    // fecha es la del viaje que se vendió, no la de la venta, y es lo primero
    // que hay que saber para leer la columna.
    header: 'Primer viaje vendido',
    // ISO 8601 y no dd/mm/aaaa: un informe archivado pierde el contexto que
    // haría falta para desambiguar 08/09.
    meta: { unidad: 'AAAA-MM-DD', className: 'tabular-nums' },
    cell: ({ row }) => formatearFechaISO(row.original.primerViaje),
  },
  {
    id: 'ultimo-viaje',
    header: 'Último viaje vendido',
    meta: { unidad: 'AAAA-MM-DD', className: 'tabular-nums' },
    cell: ({ row }) => formatearFechaISO(row.original.ultimoViaje),
  },
]
