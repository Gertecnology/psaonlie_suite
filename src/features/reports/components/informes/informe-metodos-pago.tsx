import { IconFileSpreadsheet } from '@tabler/icons-react'
import {
  formatearEntero,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ComposicionMetodosPago } from '@/features/dashboard/components/composicion-metodos-pago'
import {
  EstadoError,
  EstadoVacio,
  SkeletonTabla,
} from '@/features/dashboard/components/estados'
import { useEstadisticas } from '@/features/dashboard/hooks/use-estadisticas'
import type { EstadoFiltrosPanel } from '@/features/dashboard/hooks/use-filtros-panel'
import {
  ETIQUETAS_METODO_PAGO,
  type MetodoPago,
} from '@/features/dashboard/models/ventas.model'
import { exportarAExcel } from '../../utils/exportar-excel'

interface Props {
  filtros: EstadoFiltrosPanel
}

/**
 * Ventas y montos por método de cobro.
 *
 * El monto es el pasaje: el endpoint de estadísticas no desagrega el cargo por
 * servicio por método de pago. Se dice explícitamente al pie en vez de dejar
 * que el lector suponga que es el total cobrado.
 */
export function InformeMetodosPago({ filtros }: Props) {
  const consulta = useEstadisticas({
    periodo: filtros.periodo,
    empresaId: filtros.empresaId,
  })

  if (consulta.error) {
    return (
      <EstadoError
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      />
    )
  }

  if (consulta.isPending) return <SkeletonTabla filas={5} />

  const metodos = (consulta.data?.porMetodoPago ?? [])
    .filter((m) => m.cantidad > 0 || m.monto > 0)
    .sort((a, b) => b.monto - a.monto)

  if (metodos.length === 0) {
    return (
      <EstadoVacio
        titulo='Sin ventas por método de pago'
        descripcion='No se registraron cobros en este período. Probá ampliando el rango de fechas.'
      />
    )
  }

  const totalMonto = metodos.reduce((acc, m) => acc + m.monto, 0)
  const totalCantidad = metodos.reduce((acc, m) => acc + m.cantidad, 0)

  const exportar = () =>
    exportarAExcel({
      nombreArchivo: 'informe-metodos-pago',
      nombreHoja: 'Métodos de pago',
      filas: metodos,
      columnas: [
        {
          encabezado: 'Método de pago',
          valor: (m) =>
            ETIQUETAS_METODO_PAGO[m.metodoPago as MetodoPago] ?? m.metodoPago,
          ancho: 20,
        },
        { encabezado: 'Ventas', valor: (m) => m.cantidad },
        { encabezado: 'Pasaje vendido', valor: (m) => m.monto, ancho: 18 },
        {
          encabezado: 'Ticket promedio',
          valor: (m) => (m.cantidad > 0 ? m.monto / m.cantidad : 0),
          ancho: 18,
        },
      ],
      totales: ['Total', totalCantidad, totalMonto, ''],
    })

  return (
    <div className='space-y-6'>
      <ComposicionMetodosPago
        metodos={consulta.data?.porMetodoPago}
        cargando={false}
      />

      <div className='flex justify-end'>
        <Button variant='outline' size='sm' onClick={exportar}>
          <IconFileSpreadsheet className='size-4' aria-hidden />
          Exportar a Excel
        </Button>
      </div>

      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Método de pago</TableHead>
              <TableHead className='text-end'>Ventas</TableHead>
              <TableHead className='text-end'>Pasaje vendido</TableHead>
              <TableHead className='text-end'>Ticket promedio</TableHead>
              <TableHead className='text-end'>Participación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metodos.map((metodo) => (
              <TableRow key={metodo.metodoPago}>
                <TableCell className='font-medium'>
                  {ETIQUETAS_METODO_PAGO[metodo.metodoPago as MetodoPago] ??
                    metodo.metodoPago}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearEntero(metodo.cantidad)}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearGuaranies(metodo.monto)}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearGuaranies(
                    metodo.cantidad > 0 ? metodo.monto / metodo.cantidad : 0,
                  )}
                </TableCell>
                <TableCell className='text-end tabular-nums'>
                  {formatearPorcentaje(
                    totalMonto > 0 ? (metodo.monto / totalMonto) * 100 : 0,
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className='font-medium'>Total</TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearEntero(totalCantidad)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearGuaranies(totalMonto)}
              </TableCell>
              <TableCell className='text-end tabular-nums'>
                {formatearGuaranies(
                  totalCantidad > 0 ? totalMonto / totalCantidad : 0,
                )}
              </TableCell>
              <TableCell className='text-end tabular-nums'>100,0%</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <p className='text-muted-foreground text-xs'>
        Los montos son de pasaje. El endpoint de estadísticas no desagrega el
        cargo por servicio por método de pago.
      </p>
    </div>
  )
}
