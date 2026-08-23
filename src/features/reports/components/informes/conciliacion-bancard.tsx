import { type ColumnDef } from '@tanstack/react-table'
import { DataTable, useTablaServidor } from '@/components/data-table'
import { TableCell, TableRow } from '@/components/ui/table'
import { formatearEntero, formatearFechaISO, formatearGuaranies } from '@/lib/formato'
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
          /* La comparación es la tabla. Los dos lados y el veredicto eran dos
             tarjetas y un cartel antes del primer dato; ahora el total de cada
             lado cierra la tabla, que es donde se contrastan. */
          <DataTable
            columns={COLUMNAS}
            data={data.descuadres}
            // Una venta puede aparecer sin id de Bancard y viceversa; el par de
            // los dos es lo único que identifica una diferencia.
            getRowId={(fila) =>
              `${fila.ventaId ?? 'sin-venta'}:${fila.bancardTransactionId ?? 'sin-tx'}`
            }
            pageCount={Math.max(data.totalPages, 1)}
            pagination={tabla.pagination}
            onPaginationChange={tabla.onPaginationChange}
            caption='Diferencias entre lo aprobado por Bancard y lo registrado en el sistema'
            emptyMessage='El período concilia: lo aprobado por Bancard coincide con lo registrado.'
            renderFooter={() => (
              <>
                <TableRow>
                  <TableCell colSpan={4} className='font-medium'>
                    Según Bancard
                    <span className='text-muted-foreground ml-2 text-xs font-normal'>
                      {formatearEntero(data.bancard.transaccionesAprobadas)}{' '}
                      transacciones aprobadas
                    </span>
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    className='text-right tabular-nums'
                    data-tipo='monto'
                  >
                    {formatearGuaranies(data.bancard.montoAprobado)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4} className='font-medium'>
                    Según el sistema
                    <span className='text-muted-foreground ml-2 text-xs font-normal'>
                      {formatearEntero(data.registrado.ventasPagadas)} ventas
                      dadas por pagadas
                    </span>
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    className='text-right tabular-nums'
                    data-tipo='monto'
                  >
                    {formatearGuaranies(data.registrado.montoEsperado)}
                  </TableCell>
                </TableRow>
                <TableRow className='border-t-2'>
                  <TableCell colSpan={4} className='font-semibold'>
                    Diferencia
                  </TableCell>
                  <TableCell
                    colSpan={3}
                    className={
                      data.concilia
                        ? 'text-right font-semibold tabular-nums'
                        : 'text-destructive text-right font-semibold tabular-nums'
                    }
                    data-tipo='monto'
                  >
                    {formatearGuaranies(data.diferencia)}
                  </TableCell>
                </TableRow>
              </>
            )}
          />
        ) : undefined
      }
    >
      <FiltrosInformeControles borrador={borrador} onCambiar={cambiar} />
    </MarcoInforme>
  )
}
