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
    <div className='space-y-6'>
      <section className='grid gap-4 md:grid-cols-2'>
        <Tarjeta
          titulo='Servicios con ventas'
          valor={formatearEntero(datos.total)}
          unidad='servicios'
          nota={`Página ${datos.page} de ${Math.max(datos.totalPages, 1)}.`}
        />
        <Tarjeta
          titulo='Servicios en esta página'
          valor={formatearEntero(datos.data.length)}
          unidad='servicios'
          nota='Las cifras de la grilla son las de estas filas, no las del período.'
        />
      </section>

      <section className='space-y-2'>
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
        <p className='text-muted-foreground text-xs'>
          Las fechas son las del viaje vendido, no las de la venta. La grilla no
          lleva fila de totales: el informe se pagina en la base y la API no
          informa los totales del período, así que sumar lo que está en pantalla
          diría "total" sobre una sola página.
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
    header: 'Primer viaje',
    // ISO 8601 y no dd/mm/aaaa: un informe archivado pierde el contexto que
    // haría falta para desambiguar 08/09.
    meta: { unidad: 'AAAA-MM-DD', className: 'tabular-nums' },
    cell: ({ row }) => formatearFechaISO(row.original.primerViaje),
  },
  {
    id: 'ultimo-viaje',
    header: 'Último viaje',
    meta: { unidad: 'AAAA-MM-DD', className: 'tabular-nums' },
    cell: ({ row }) => formatearFechaISO(row.original.ultimoViaje),
  },
]

function Tarjeta({
  titulo,
  valor,
  unidad,
  nota,
}: {
  titulo: string
  valor: string
  unidad: string
  nota: string
}) {
  return (
    <div className='tarjeta-informe rounded-md border p-4'>
      <h3 className='text-muted-foreground text-sm'>{titulo}</h3>
      <p className='mt-1 text-2xl font-semibold tabular-nums' data-tipo='monto'>
        {valor}
      </p>
      {/* Sin la unidad, "1.240" no dice si son guaraníes, ventas o servicios, y
          el lector de un informe archivado no tiene dónde averiguarlo. */}
      <p className='text-muted-foreground text-xs'>{unidad}</p>
      <p className='text-muted-foreground mt-3 text-xs'>{nota}</p>
    </div>
  )
}
