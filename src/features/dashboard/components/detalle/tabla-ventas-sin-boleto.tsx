import {
  formatearFecha,
  formatearFechaHora,
  formatearGuaranies,
} from '@/lib/formato'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ETIQUETAS_METODO_PAGO,
  type MetodoPago,
} from '../../models/ventas.model'
import type { VentasSinBoleto } from '../../models/alertas.model'
import { EstadoVacio } from '../estados'

interface Props {
  datos: VentasSinBoleto | undefined
}

/**
 * Detalle de las ventas cobradas sin boleto.
 *
 * Cada fila lleva el número de transacción porque es lo que hace falta para
 * buscar la venta en el sistema de la empresa y reconciliarla a mano.
 */
export function TablaVentasSinBoleto({ datos }: Props) {
  if (!datos || datos.detalle.length === 0) {
    return (
      <EstadoVacio
        titulo='Sin ventas cobradas sin boleto'
        descripcion='Todas las ventas pagadas del período analizado tienen su boleto emitido.'
      />
    )
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transacción</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Viaje</TableHead>
            <TableHead>Método</TableHead>
            <TableHead className='text-end'>Cobrado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datos.detalle.map((venta) => (
            <TableRow key={venta.id}>
              <TableCell className='font-medium tabular-nums'>
                {venta.numeroTransaccion}
                <span className='text-muted-foreground block text-xs font-normal'>
                  {formatearFechaHora(venta.fechaVenta)}
                </span>
              </TableCell>
              <TableCell>{venta.empresaNombre}</TableCell>
              <TableCell>{venta.cliente}</TableCell>
              <TableCell className='tabular-nums'>
                {formatearFecha(venta.fechaViaje)}
              </TableCell>
              <TableCell>
                <Badge variant='outline'>
                  {ETIQUETAS_METODO_PAGO[venta.metodoPago as MetodoPago] ??
                    venta.metodoPago}
                </Badge>
              </TableCell>
              <TableCell className='text-end font-medium tabular-nums'>
                {formatearGuaranies(venta.cobradoAlCliente)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className='text-muted-foreground mt-4 text-xs leading-relaxed'>
        El monto es lo que efectivamente se le cobró al cliente: pasaje más
        cargo por servicio.{' '}
        {datos.parcial &&
          `Se analizaron las ${datos.analizadas} ventas pagadas más recientes de ${datos.totalPagadas}.`}
      </p>
    </div>
  )
}
