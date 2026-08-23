import * as React from 'react'
import type {
  ColumnDef,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import {
  formatearEntero,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { DataTable, useTablaServidor } from '@/components/data-table'
import { TableCell, TableRow } from '@/components/ui/table'
import { informePorRuta, type FiltrosInforme } from '../../models/informe.model'
import type {
  InformePorAgencia,
  SaldoAgencia,
} from '../../models/por-agencia.model'
import { useFiltrosInforme } from '../../hooks/use-filtros-informe'
import { useInforme } from '../../hooks/use-informe'
import { exportarInformes } from '../../services/informes.service'
import { FiltrosInformeControles } from '../filtros-informe'
import { MarcoInforme } from '../marco-informe'

const DEFINICION = informePorRuta('por-agencia')!

/**
 * How much to transfer to each company.
 *
 * This is the one report the money moves on: every row is a transfer to make.
 * The panel used to answer it by subtracting commissions from the generic
 * statistics endpoint on the client, so the figure a person acted on was a
 * panel-side calculation that nothing else in the system agreed with. Here the
 * saldo is the backend's, derived from the same data it settles with.
 */
export function InformePorAgencia() {
  const { borrador, aplicados, cambiar, generar, puedeGenerar } =
    useFiltrosInforme()
  const { pagination, onPaginationChange } = useTablaServidor()

  // La página y el tamaño viajan SIEMPRE explícitos. Si se dejaran fuera, el
  // servidor aplicaría su propio límite por defecto (25) mientras la tabla
  // sigue diciendo 10 por página: el pie diría una cosa y la grilla otra.
  const filtros = React.useMemo<FiltrosInforme>(
    () => ({
      ...aplicados,
      pagina: pagination.pageIndex + 1,
      tamano: pagination.pageSize,
    }),
    [aplicados, pagination],
  )

  const { data, isLoading, isFetching, error } = useInforme<InformePorAgencia>(
    DEFINICION.ruta,
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
  datos: InformePorAgencia
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  isFetching: boolean
}) {
  const { totales } = datos

  // Se mira sobre el período entero, no sobre la página: que la advertencia
  // aparezca o no según en qué página estés parado sería un accidente.
  const hayCobradoSinEntregar = totales.pagadasSinBoletoMonto > 0

  return (
    <div className='space-y-6'>
      {hayCobradoSinEntregar && (
        <div
          role='alert'
          className='border-destructive/50 text-destructive flex items-start gap-3 rounded-md border p-4'
        >
          <AlertTriangle className='mt-0.5 h-5 w-5 shrink-0' />
          <div className='text-sm'>
            <p className='font-medium'>
              Hay {formatearGuaranies(totales.pagadasSinBoletoMonto)} cobrados
              sin pasaje entregado
            </p>
            <p className='mt-1'>
              Son ventas con el pago registrado y ningún boleto emitido. No
              entran en el saldo a transferir —la empresa no prestó el
              servicio—, pero el dinero ya salió del bolsillo del cliente. Las
              filas marcadas abajo son las empresas donde ocurre.
            </p>
          </div>
        </div>
      )}

      <section className='grid gap-4 md:grid-cols-3'>
        <Tarjeta
          titulo='Saldo a pagar'
          valor={formatearGuaranies(totales.saldoAPagar)}
          unidad='PYG'
          nota='La suma de todas las transferencias pendientes del período.'
        />
        <Tarjeta
          titulo='Comisión descontada'
          valor={formatearGuaranies(totales.comisionDescontada)}
          unidad='PYG'
          nota='Se descuenta de la transferencia, no se le cobra a la empresa.'
        />
        <Tarjeta
          titulo='Empresas con saldo'
          valor={formatearEntero(datos.total)}
          unidad='empresas'
          nota={`Página ${datos.page} de ${Math.max(datos.totalPages, 1)}.`}
        />
      </section>

      <section className='space-y-2'>
        <DataTable
          columns={COLUMNAS}
          data={datos.data}
          // La empresa sin registrar viene con `agenciaId` nulo y es una fila
          // real: necesita una clave estable igual que las demás.
          getRowId={(fila) => fila.agenciaId ?? 'sin-agencia'}
          pageCount={datos.totalPages}
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          isFetching={isFetching}
          caption='Saldo a transferir a cada empresa en el período, con la comisión vigente y las ventas cobradas sin boleto'
          emptyMessage='El período no tiene ventas liquidables de ninguna empresa.'
          // El color no puede ser la única señal: en papel no se imprime y a
          // quien no distingue rojo no le llega. La celda lo dice con texto.
          rowProps={(fila) =>
            fila.pagadasSinBoletoCantidad > 0
              ? { className: 'bg-destructive/5' }
              : {}
          }
          renderFooter={() => (
            <TableRow>
              <TableCell className='font-medium'>
                Total del período
                <span className='text-muted-foreground block text-xs font-normal'>
                  todas las empresas, no sólo esta página
                </span>
              </TableCell>
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell data-tipo='monto' className='text-right tabular-nums'>
                {formatearGuaranies(totales.pasajes)}
              </TableCell>
              <TableCell data-tipo='monto' className='text-right tabular-nums'>
                {formatearGuaranies(totales.comisionDescontada)}
              </TableCell>
              {/* La API totaliza cinco líneas y las devoluciones no son una de
                  ellas. Un total inventado acá sería un número que no existe en
                  ninguna otra parte del sistema. */}
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell
                data-tipo='monto'
                className='text-right font-semibold tabular-nums'
              >
                {formatearGuaranies(totales.saldoAPagar)}
              </TableCell>
              <TableCell data-tipo='monto' className='text-right'>
                —
              </TableCell>
              <TableCell data-tipo='monto' className='text-right tabular-nums'>
                {formatearGuaranies(totales.pagadasSinBoletoMonto)}
              </TableCell>
              <TableCell data-tipo='monto' className='text-right tabular-nums'>
                {formatearPorcentaje(100)}
              </TableCell>
            </TableRow>
          )}
        />
        <p className='text-muted-foreground text-xs'>
          Los totales son de todas las empresas del período. Las devoluciones no
          llevan total porque la API no lo informa.
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

const COLUMNAS: ColumnDef<SaldoAgencia, unknown>[] = [
  {
    id: 'empresa',
    header: 'Empresa',
    cell: ({ row }) => (
      <span className='font-medium'>{row.original.empresaNombre}</span>
    ),
  },
  {
    id: 'comision-vigente',
    header: 'Comisión vigente',
    meta: { ...MONTO, unidad: '%' },
    cell: ({ row }) => {
      const porcentaje = row.original.porcentajeComisionVigente
      // Es la comisión configurada HOY, no la que se aplicó a cada venta: si
      // cambió a mitad del período, no tiene por qué cuadrar con la columna
      // de al lado, y eso no es un error.
      return porcentaje === null ? (
        <span className='text-muted-foreground'>—</span>
      ) : (
        formatearPorcentaje(porcentaje)
      )
    },
  },
  {
    id: 'pasajes',
    header: 'Pasajes',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.pasajes),
  },
  {
    id: 'comision-descontada',
    header: 'Comisión descontada',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.comisionDescontada),
  },
  {
    id: 'devoluciones',
    header: 'Devoluciones',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => formatearGuaranies(row.original.devolucionesPasajes),
  },
  {
    id: 'saldo',
    header: 'Saldo a pagar',
    meta: { ...MONTO, unidad: 'PYG', className: 'text-right font-semibold tabular-nums' },
    cell: ({ row }) => formatearGuaranies(row.original.saldoAPagar),
  },
  {
    id: 'sin-boleto-cantidad',
    header: 'Cobradas sin boleto',
    meta: { ...MONTO, unidad: 'ventas' },
    cell: ({ row }) => {
      const cantidad = row.original.pagadasSinBoletoCantidad
      if (cantidad === 0) return <span className='text-muted-foreground'>—</span>
      return (
        <span className='text-destructive font-semibold'>
          {formatearEntero(cantidad)}
          <span className='sr-only'>
            {' '}
            ventas cobradas al cliente sin pasaje entregado
          </span>
        </span>
      )
    },
  },
  {
    id: 'sin-boleto-monto',
    header: 'Monto sin entregar',
    meta: { ...MONTO, unidad: 'PYG' },
    cell: ({ row }) => {
      const monto = row.original.pagadasSinBoletoMonto
      return monto === 0 ? (
        <span className='text-muted-foreground'>—</span>
      ) : (
        <span className='text-destructive'>{formatearGuaranies(monto)}</span>
      )
    },
  },
  {
    id: 'participacion',
    header: 'Participación',
    meta: { ...MONTO, unidad: '% del período' },
    cell: ({ row }) => formatearPorcentaje(row.original.participacion),
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
      {/* Sin la unidad, "1.240" no dice si son guaraníes, ventas o empresas, y
          el lector de un informe archivado no tiene dónde averiguarlo. */}
      <p className='text-muted-foreground text-xs'>{unidad}</p>
      <p className='text-muted-foreground mt-3 text-xs'>{nota}</p>
    </div>
  )
}
