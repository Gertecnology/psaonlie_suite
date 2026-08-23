import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, useTablaServidor } from '@/components/data-table'
import { formatearEntero, formatearFechaISO, formatearGuaranies } from '@/lib/formato'
import { Badge } from '@/components/ui/badge'
import { informePorRuta } from '../../models/informe.model'
import {
  EXPLICACION_DESCUADRE,
  type ConciliacionBancard,
  type DescuadreBancard,
} from '../../models/conciliacion-bancard.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('conciliacion-bancard')!

const COLUMNAS: ColumnDef<DescuadreBancard, unknown>[] = [
  {
    id: 'tipo',
    accessorKey: 'tipo',
    header: 'Qué pasó',
    cell: ({ row }) => {
      const explicacion = EXPLICACION_DESCUADRE[row.original.tipo]
      return (
        <div className='max-w-sm'>
          <p className='font-medium'>{explicacion.titulo}</p>
          <p className='text-muted-foreground text-xs leading-relaxed'>
            {explicacion.significado}
          </p>
        </div>
      )
    },
  },
  {
    id: 'numeroTransaccion',
    accessorKey: 'numeroTransaccion',
    header: 'Venta',
    cell: ({ row }) => (
      <span className='font-mono text-xs'>
        {row.original.numeroTransaccion ?? '—'}
      </span>
    ),
  },
  {
    id: 'bancardTransactionId',
    accessorKey: 'bancardTransactionId',
    header: 'Transacción Bancard',
    cell: ({ row }) => (
      <span className='font-mono text-xs'>
        {row.original.bancardTransactionId ?? '—'}
      </span>
    ),
  },
  {
    id: 'fechaVenta',
    accessorKey: 'fechaVenta',
    header: 'Fecha',
    cell: ({ row }) => formatearFechaISO(row.original.fechaVenta),
  },
  {
    id: 'montoEsperado',
    accessorKey: 'montoEsperado',
    header: 'Registrado',
    meta: { tipo: 'monto', unidad: 'PYG', className: 'text-right' },
    cell: ({ row }) => formatearGuaranies(row.original.montoEsperado),
  },
  {
    id: 'montoBancard',
    accessorKey: 'montoBancard',
    header: 'Bancard',
    meta: { tipo: 'monto', unidad: 'PYG', className: 'text-right' },
    cell: ({ row }) => formatearGuaranies(row.original.montoBancard),
  },
  {
    id: 'diferencia',
    accessorKey: 'diferencia',
    header: 'Diferencia',
    meta: { tipo: 'monto', unidad: 'PYG', className: 'text-right' },
    cell: ({ row }) => (
      <span className='text-destructive font-medium'>
        {formatearGuaranies(row.original.diferencia)}
      </span>
    ),
  },
]

/**
 * What the gateway says against what we recorded.
 *
 * The panel used to build this from a generic statistics endpoint plus a
 * separate payments summary, and the screen itself admitted the real
 * reconciliation was not possible yet. The backend has had the endpoint all
 * along: it counts both sides independently and lists every mismatch, which is
 * the only version of this report that is worth anything — a total that agrees
 * proves nothing if you cannot see what was compared.
 */
export function InformeConciliacionBancard() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()
  const tabla = useTablaServidor()

  const { data, isLoading, error } = useInforme<ConciliacionBancard>(
    DEFINICION.ruta,
    { ...aplicados, pagina: tabla.parametrosApi.page, tamano: tabla.parametrosApi.limit },
  )

  return (
    <MarcoInforme
      definicion={DEFINICION}
      filtros={aplicados}
      periodo={data?.periodo}
      isLoading={isLoading}
      error={error}
      onGenerar={generar}
      puedeGenerar={puedeGenerar}
      resultado={
        data ? (
          <div className='space-y-6'>
            <Veredicto datos={data} />

            <section className='grid gap-4 md:grid-cols-2'>
              <Lado
                titulo='Según Bancard'
                subtitulo='Transacciones aprobadas por la pasarela'
                cantidad={data.bancard.transaccionesAprobadas}
                unidadCantidad='transacciones'
                monto={data.bancard.montoAprobado}
              />
              <Lado
                titulo='Según el sistema'
                subtitulo='Ventas con tarjeta dadas por pagadas'
                cantidad={data.registrado.ventasPagadas}
                unidadCantidad='ventas'
                monto={data.registrado.montoEsperado}
              />
            </section>

            {data.descuadres.length > 0 && (
              <section>
                <h3 className='mb-2 font-semibold'>
                  Diferencias encontradas
                  <span className='text-muted-foreground ml-2 text-sm font-normal'>
                    ({formatearEntero(data.totalDescuadres)} en total)
                  </span>
                </h3>
                <DataTable
                  columns={COLUMNAS}
                  data={data.descuadres}
                  // Una venta puede aparecer sin id de Bancard y viceversa; el
                  // par de los dos es lo único que identifica una diferencia.
                  getRowId={(fila) =>
                    `${fila.ventaId ?? 'sin-venta'}:${fila.bancardTransactionId ?? 'sin-tx'}`
                  }
                  pageCount={Math.max(data.totalPages, 1)}
                  pagination={tabla.pagination}
                  onPaginationChange={tabla.onPaginationChange}
                  caption='Diferencias entre lo aprobado por Bancard y lo registrado en el sistema'
                  emptyMessage='Sin diferencias en el período.'
                />
              </section>
            )}
          </div>
        ) : undefined
      }
    >
      <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
    </MarcoInforme>
  )
}

function Veredicto({ datos }: { datos: ConciliacionBancard }) {
  if (datos.concilia) {
    return (
      <div className='flex items-center gap-3 rounded-md border border-green-600/40 p-4 text-green-700 dark:text-green-500'>
        <CheckCircle2 className='h-5 w-5 shrink-0' />
        <p className='text-sm font-medium'>
          El período concilia: lo que aprobó Bancard coincide con lo registrado.
        </p>
      </div>
    )
  }

  return (
    <div
      role='alert'
      className='border-destructive/50 text-destructive flex items-start gap-3 rounded-md border p-4'
    >
      <TriangleAlert className='mt-0.5 h-5 w-5 shrink-0' />
      <div className='text-sm'>
        <p className='font-medium'>
          Hay una diferencia de {formatearGuaranies(Math.abs(datos.diferencia))}
        </p>
        <p className='mt-1'>
          {datos.diferencia > 0
            ? 'El sistema registró MÁS de lo que aprobó Bancard: hay ventas dadas por cobradas sin respaldo de la pasarela.'
            : 'Bancard aprobó MÁS de lo que el sistema registró: hay clientes a los que se les debitó y su venta no figura como pagada.'}
        </p>
      </div>
    </div>
  )
}

function Lado({
  titulo,
  subtitulo,
  cantidad,
  unidadCantidad,
  monto,
}: {
  titulo: string
  subtitulo: string
  cantidad: number
  unidadCantidad: string
  monto: number
}) {
  return (
    <div className='tarjeta-informe rounded-md border p-4'>
      <h3 className='font-medium'>{titulo}</h3>
      <p className='text-muted-foreground text-xs'>{subtitulo}</p>
      <p className='mt-3 text-2xl font-semibold tabular-nums' data-tipo='monto'>
        {formatearGuaranies(monto)}
      </p>
      <p className='text-muted-foreground mt-1 text-sm'>
        <Badge variant='secondary' className='tabular-nums'>
          {formatearEntero(cantidad)}
        </Badge>{' '}
        {unidadCantidad}
      </p>
    </div>
  )
}
