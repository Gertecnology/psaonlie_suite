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
import { TableCell, TableRow } from '@/components/ui/table'
import {
  informePorRuta,
  rutaApi,
  type FiltrosInforme,
} from '../../models/informe.model'
import { etiquetaMetodoPago } from '../../models/por-metodo-pago.model'
import {
  HORAS_PARA_ANTIGUA,
  type InformeVentasSinBoleto,
  type VentaPagadaSinBoleto,
} from '../../models/ventas-sin-boleto.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { exportarInformes } from '../../services/informes.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('ventas-sin-boleto')!

/**
 * Money collected with no ticket handed over.
 *
 * Every other report counts these sales as revenue; this is the only screen
 * that names the people behind them, which is why it carries the customer's
 * email and phone. It is a worklist, not a statistic.
 *
 * Age is the column that ranks the work. Minutes after a sale, an unissued
 * ticket is a gateway callback still in flight. A day later it is a person who
 * paid, got nothing, and has not been called — so rows past
 * `HORAS_PARA_ANTIGUA` are marked, in text and not only in colour.
 */
export function InformeVentasSinBoleto() {
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

  const { data, isLoading, isFetching, error } =
    // El endpoint se llama `ventas-pagadas-sin-boleto`; la URL del navegador,
    // `ventas-sin-boleto`. `rutaApi` resuelve cuál va a la API.
    useInforme<InformeVentasSinBoleto>(rutaApi(DEFINICION), filtros)

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
  datos: InformeVentasSinBoleto
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  isFetching: boolean
}) {
  return (
    <div className='space-y-4'>
      {/* Ni cartel ni tarjetas: la tabla es la lista de casos a atender, y el
          total del período cierra el pie. Las filas con más de
          HORAS_PARA_ANTIGUA horas quedan marcadas ahí mismo. */}
      <section className='space-y-2'>
        <DataTable
          columns={COLUMNAS}
          data={datos.data}
          getRowId={(venta) => venta.ventaId}
          pageCount={datos.totalPages}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          isFetching={isFetching}
          caption='Ventas del período con el pago registrado y ningún boleto emitido, con su antigüedad y el contacto del cliente'
          emptyMessage='El período no tiene ventas cobradas sin boleto. Es el resultado que se busca.'
          // El color no puede ser la única señal: en papel no se imprime y a
          // quien no distingue rojo no le llega. La celda lo dice con texto.
          rowProps={(venta) =>
            venta.antiguedadHoras >= HORAS_PARA_ANTIGUA
              ? { className: 'bg-destructive/5' }
              : {}
          }
          renderFooter={() => (
            <TableRow>
              <TableCell className='font-medium'>
                Total del período
                <span className='text-muted-foreground block text-xs font-normal'>
                  {formatearEntero(datos.total)} ventas, todas las páginas
                </span>
              </TableCell>
              {/* La API totaliza el cobrado al cliente y nada más. Un total de
                  pasaje o de cargo por servicio inventado acá sería un número
                  que no existe en ninguna otra parte del sistema. */}
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell
                data-tipo='monto'
                className='text-right font-semibold tabular-nums'
              >
                {formatearGuaranies(datos.montoTotal)}
              </TableCell>
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
            </TableRow>
          )}
        />
        <p className='text-muted-foreground text-xs'>
          El único total que informa la API es el cobrado al cliente sobre todo
          el período; las demás columnas no llevan total porque sumarlas acá
          diría "período" sobre una sola página.
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

const COLUMNAS: ColumnDef<VentaPagadaSinBoleto, unknown>[] = [
  {
    id: 'venta',
    header: 'Venta',
    cell: ({ row }) => (
      <>
        <span className='font-medium'>{row.original.numeroTransaccion}</span>
        {/* Sin el id de Bancard no se puede rastrear el cobro en la pasarela,
            que es el primer paso para decidir si se emite o se devuelve. */}
        {row.original.bancardTransactionId && (
          <span className='text-muted-foreground block font-mono text-xs'>
            Bancard {row.original.bancardTransactionId}
          </span>
        )}
      </>
    ),
  },
  {
    id: 'empresa',
    header: 'Empresa',
    cell: ({ row }) => (
      <>
        {row.original.empresaNombre}
        <span className='text-muted-foreground block text-xs'>
          {row.original.estadoVenta}
        </span>
      </>
    ),
  },
  {
    id: 'fecha-venta',
    header: 'Fecha de venta',
    meta: { unidad: 'AAAA-MM-DD', className: 'tabular-nums' },
    cell: ({ row }) => formatearFechaISO(row.original.fechaVenta),
  },
  {
    id: 'fecha-viaje',
    header: 'Fecha de viaje',
    meta: { unidad: 'AAAA-MM-DD', className: 'tabular-nums' },
    cell: ({ row }) => formatearFechaISO(row.original.fechaViaje),
  },
  {
    id: 'metodo',
    header: 'Método de pago',
    cell: ({ row }) => etiquetaMetodoPago(row.original.metodoPago),
  },
  {
    id: 'antiguedad',
    header: 'Antigüedad',
    meta: { ...MONTO, unidad: 'horas' },
    cell: ({ row }) => <Antiguedad horas={row.original.antiguedadHoras} />,
  },
  {
    id: 'pasaje',
    header: 'Pasaje',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.pasaje),
  },
  {
    id: 'cargo-servicio',
    header: 'Cargo por servicio',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.cargoServicio),
  },
  {
    id: 'cobrado',
    header: 'Cobrado al cliente',
    meta: {
      ...MONTO,
      unidad: 'PYG',
      className: 'text-right font-semibold tabular-nums',
    },
    cell: ({ row }) => formatearGuaranies(row.original.cobradoAlCliente),
  },
  {
    id: 'contacto',
    header: 'Contacto',
    // Es el dato por el que se abre este informe: sin él la fila dice que hay
    // un problema y no a quién llamar.
    cell: ({ row }) => <Contacto venta={row.original} />,
  },
]

function Antiguedad({ horas }: { horas: number }) {
  const esAntigua = horas >= HORAS_PARA_ANTIGUA
  const dias = Math.floor(horas / 24)

  if (!esAntigua) return <>{formatearEntero(horas)}</>

  return (
    <span className='text-destructive font-semibold'>
      {formatearEntero(horas)}
      <span className='sr-only'> horas sin pasaje entregado</span>
      <span className='block text-xs font-normal'>
        {dias === 1 ? 'hace 1 día' : `hace ${formatearEntero(dias)} días`}
      </span>
    </span>
  )
}

function Contacto({ venta }: { venta: VentaPagadaSinBoleto }) {
  if (!venta.contactoEmail && !venta.contactoTelefono) {
    return (
      <span className='text-destructive text-xs'>
        Sin datos de contacto
        <span className='sr-only'>
          {' '}
          — no hay forma de avisarle al cliente
        </span>
      </span>
    )
  }

  return (
    <div className='text-xs'>
      {venta.contactoEmail && <span className='block'>{venta.contactoEmail}</span>}
      {venta.contactoTelefono && (
        <span className='text-muted-foreground block tabular-nums'>
          {venta.contactoTelefono}
        </span>
      )}
    </div>
  )
}
