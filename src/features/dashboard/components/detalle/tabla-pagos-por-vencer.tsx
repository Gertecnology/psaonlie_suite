import { formatearFechaHora, formatearGuaranies } from '@/lib/formato'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PagoPorVencer, PagosPorVencer } from '../../models/alertas.model'
import { ETIQUETAS_METODO_PAGO } from '../../models/ventas.model'
import { EstadoVacio } from '../estados'

interface Props {
  datos: PagosPorVencer | undefined
}

export function TablaPagosPorVencer({ datos }: Props) {
  const filas = [...(datos?.vencidos ?? []), ...(datos?.porVencer ?? [])]

  if (filas.length === 0) {
    return (
      <EstadoVacio
        titulo='Sin pagos por vencer'
        descripcion='Ninguna reserva con pago pendiente vence en las próximas horas.'
      />
    )
  }

  return (
    <div className='overflow-x-auto'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transacción</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Ruta</TableHead>
            <TableHead>Vence</TableHead>
            <TableHead>Comprobante</TableHead>
            <TableHead className='text-end'>Importe</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((pago) => (
            <TableRow key={pago.ventaId}>
              <TableCell className='font-medium tabular-nums'>
                {pago.numeroTransaccion}
                <span className='text-muted-foreground block text-xs font-normal'>
                  {ETIQUETAS_METODO_PAGO[pago.metodoPago] ?? pago.metodoPago} ·{' '}
                  {pago.empresa}
                </span>
              </TableCell>
              <TableCell>{pago.cliente}</TableCell>
              <TableCell className='text-sm'>
                {pago.origen} → {pago.destino}
              </TableCell>
              <TableCell>
                <EtiquetaVencimiento pago={pago} />
              </TableCell>
              <TableCell>
                {pago.tieneComprobante ? (
                  <Badge variant='outline'>Cargado</Badge>
                ) : (
                  <span className='text-muted-foreground text-xs'>
                    Sin cargar
                  </span>
                )}
              </TableCell>
              <TableCell className='text-end font-medium tabular-nums'>
                {formatearGuaranies(pago.importeTotal)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className='text-muted-foreground mt-4 text-xs leading-relaxed'>
        El importe es sólo el pasaje: el endpoint de pagos pendientes no
        devuelve el cargo por servicio.
      </p>
    </div>
  )
}

function EtiquetaVencimiento({ pago }: { pago: PagoPorVencer }) {
  const vencido = pago.horasRestantes !== null && pago.horasRestantes <= 0

  return (
    <span className='flex flex-col'>
      <span
        className={
          vencido
            ? 'text-[var(--estado-serio)] text-sm font-medium'
            : 'text-sm font-medium'
        }
      >
        {vencido ? 'Vencido' : pago.tiempoRestante}
      </span>
      <span className='text-muted-foreground text-xs tabular-nums'>
        {formatearFechaHora(pago.fechaExpiracion)}
      </span>
    </span>
  )
}
