import { useMemo } from 'react'
import { IconFileSpreadsheet } from '@tabler/icons-react'
import {
  formatearEntero,
  formatearGuaranies,
  formatearPorcentaje,
  repartirPorcentajes,
} from '@/lib/formato'
import { aParametrosApi } from '@/lib/periodo'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { colorDeSerie } from '@/components/ui/chart'
import {
  EstadoError,
  EstadoVacio,
  SkeletonTabla,
} from '@/features/dashboard/components/estados'
import { TarjetaSeccion } from '@/features/dashboard/components/tarjeta-seccion'
import { TiraComposicion } from '@/features/dashboard/components/tira-composicion'
import type { EstadoFiltrosPanel } from '@/features/dashboard/hooks/use-filtros-panel'
import { useVentas } from '@/features/dashboard/hooks/use-ventas'
import {
  ESTADOS_PAGO,
  ESTADOS_VENTA,
  ETIQUETAS_ESTADO_PAGO,
  ETIQUETAS_ESTADO_VENTA,
} from '@/features/dashboard/models/ventas.model'
import { exportarAExcel } from '../../utils/exportar-excel'

interface FilaEstado {
  clave: string
  etiqueta: string
  cantidad: number
  color: string
}

interface Props {
  filtros: EstadoFiltrosPanel
}

/**
 * Distribución de las ventas por estado.
 *
 * Los conteos salen de `resumenFiltros`, que el backend calcula sobre **todo**
 * el conjunto filtrado. Por eso se pide una sola fila (`limit: 1`): el detalle
 * no hace falta, sólo los agregados, y traer miles de filas para contarlas del
 * lado del cliente sería un despilfarro y además daría mal en cuanto hubiera
 * más de una página.
 *
 * El color de cada estado sale de su posición en la lista de estados, no del
 * ranking: si un mes no hubo ventas canceladas, "expirado" no cambia de color.
 */
export function InformeEstados({ filtros }: Props) {
  const { fechaDesde, fechaHasta } = aParametrosApi(filtros.periodo)

  const consulta = useVentas({
    fechaVentaDesde: fechaDesde,
    fechaVentaHasta: fechaHasta,
    empresaId: filtros.empresaId,
    page: 1,
    limit: 1,
  })

  const resumen = consulta.data?.resumenFiltros

  const filasPago = useMemo<FilaEstado[]>(
    () =>
      ESTADOS_PAGO.map((estado, indice) => ({
        clave: estado,
        etiqueta: ETIQUETAS_ESTADO_PAGO[estado],
        cantidad: resumen?.estadosPago?.[estado] ?? 0,
        color: colorDeSerie(indice),
      })).filter((f) => f.cantidad > 0),
    [resumen],
  )

  const filasVenta = useMemo<FilaEstado[]>(
    () =>
      ESTADOS_VENTA.map((estado, indice) => ({
        clave: estado,
        etiqueta: ETIQUETAS_ESTADO_VENTA[estado],
        cantidad: resumen?.estadosVenta?.[estado] ?? 0,
        color: colorDeSerie(indice),
      })).filter((f) => f.cantidad > 0),
    [resumen],
  )

  if (consulta.error) {
    return (
      <EstadoError
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      />
    )
  }

  if (consulta.isPending) return <SkeletonTabla filas={8} />

  const total = consulta.data?.total ?? 0

  if (total === 0) {
    return (
      <EstadoVacio
        titulo='Sin ventas en el período'
        descripcion='No hay ventas en el rango elegido, así que no hay estados que distribuir.'
      />
    )
  }

  const exportar = () =>
    exportarAExcel({
      nombreArchivo: 'informe-estados',
      nombreHoja: 'Por estado',
      filas: [
        ...filasPago.map((f) => ({ tipo: 'Estado de pago', ...f })),
        ...filasVenta.map((f) => ({ tipo: 'Estado de venta', ...f })),
      ],
      columnas: [
        { encabezado: 'Dimensión', valor: (f) => f.tipo, ancho: 18 },
        { encabezado: 'Estado', valor: (f) => f.etiqueta, ancho: 22 },
        { encabezado: 'Ventas', valor: (f) => f.cantidad },
      ],
    })

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <p className='text-muted-foreground text-sm'>
          {formatearEntero(total)} ventas en el período · pasaje por{' '}
          {formatearGuaranies(resumen?.totalImporte ?? 0)}
        </p>
        <Button variant='outline' size='sm' onClick={exportar}>
          <IconFileSpreadsheet className='size-4' aria-hidden />
          Exportar a Excel
        </Button>
      </div>

      <div className='grid gap-6 xl:grid-cols-2'>
        <TarjetaSeccion
        nivel={3}
          titulo='Estado de pago'
          descripcion='Dónde está la plata: cobrada, esperando, o perdida.'
        >
          <BloqueEstados filas={filasPago} total={total} />
        </TarjetaSeccion>

        <TarjetaSeccion
        nivel={3}
          titulo='Estado de venta'
          descripcion='En qué punto del circuito quedó cada reserva.'
        >
          <BloqueEstados filas={filasVenta} total={total} />
        </TarjetaSeccion>
      </div>
    </div>
  )
}

function BloqueEstados({
  filas,
  total,
}: {
  filas: FilaEstado[]
  total: number
}) {
  if (filas.length === 0) {
    return (
      <EstadoVacio
        titulo='Sin datos'
        descripcion='El backend no devolvió conteos para esta dimensión en el período elegido.'
      />
    )
  }

  const porcentajes = repartirPorcentajes(filas.map((f) => f.cantidad))

  return (
    <div className='space-y-4'>
      <TiraComposicion
        total={total}
        segmentos={filas.map((fila) => ({
          clave: fila.clave,
          etiqueta: fila.etiqueta,
          monto: fila.cantidad,
          color: fila.color,
        }))}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Estado</TableHead>
            <TableHead className='text-end'>Ventas</TableHead>
            <TableHead className='text-end'>Participación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila, indice) => (
            <TableRow key={fila.clave}>
              <TableCell>
                <span className='flex items-center gap-2'>
                  <span
                    aria-hidden
                    className='size-2.5 shrink-0 rounded-sm'
                    style={{ backgroundColor: fila.color }}
                  />
                  {fila.etiqueta}
                </span>
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearEntero(fila.cantidad)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearPorcentaje(porcentajes[indice])}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
