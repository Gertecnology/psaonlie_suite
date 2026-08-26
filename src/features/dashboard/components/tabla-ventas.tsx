import {
  formatearFecha,
  formatearFechaHora,
  formatearGuaranies,
} from '@/lib/formato'
import { cn } from '@/lib/utils'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { calcularDesglose } from '../models/finanzas.model'
import {
  ETIQUETAS_ESTADO_PAGO,
  ETIQUETAS_ESTADO_VENTA,
  ETIQUETAS_METODO_PAGO,
  type EstadoPago,
  type VentaLista,
} from '../models/ventas.model'
import { EstadoVacio, SkeletonTabla } from './estados'

/** Un estado de pago se lee de un vistazo por su forma, no sólo por su color. */
const VARIANTE_ESTADO: Record<
  EstadoPago,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  PAGADO: 'default',
  PENDIENTE: 'secondary',
  EXPIRADO: 'outline',
  CANCELADO: 'outline',
  FALLIDO: 'destructive',
  REEMBOLSADO: 'outline',
}

interface Props {
  ventas: VentaLista[] | undefined
  cargando: boolean
  /** Oculta las columnas secundarias, para el panel principal. */
  compacta?: boolean
  vacio?: { titulo: string; descripcion: string }
}

/**
 * Tabla de ventas.
 *
 * Muestra los tres montos por separado —pasaje, cargo por servicio, cobrado— en
 * vez de un único "total" ambiguo. La columna de boletos está a propósito al
 * lado del estado de pago: una venta PAGADA con 0 boletos es el problema
 * operativo más caro que tiene el sistema, y acá se ve sin buscarlo.
 */
export function TablaVentas({
  ventas,
  cargando,
  compacta = false,
  vacio,
}: Props) {
  if (cargando && !ventas) return <SkeletonTabla filas={compacta ? 5 : 10} />

  if (!ventas || ventas.length === 0) {
    return (
      <EstadoVacio
        titulo={vacio?.titulo ?? 'Sin ventas'}
        descripcion={
          vacio?.descripcion ??
          'No hay ventas que cumplan con los filtros actuales. Probá ampliando el rango de fechas.'
        }
      />
    )
  }

  return (
    <div className='overflow-x-auto'>
      <TooltipProvider delayDuration={200}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='min-w-[9rem]'>Transacción</TableHead>
              {!compacta && <TableHead>Cliente</TableHead>}
              <TableHead className='min-w-[8rem]'>Empresa</TableHead>
              {!compacta && (
                <TableHead className='min-w-[10rem]'>Ruta</TableHead>
              )}
              <TableHead>Estado</TableHead>
              <TableHead className='text-end'>Boletos</TableHead>
              <TableHead className='text-end'>Pasaje</TableHead>
              <TableHead className='text-end'>Cargo servicio</TableHead>
              <TableHead className='text-end'>Cobrado</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {ventas.map((venta) => {
              const desglose = calcularDesglose({
                pasaje: venta.importeTotal,
                cargoServicio: venta.serviceChargeMontoTotal,
                comision: venta.comisionTotal,
              })
              const sinBoleto =
                venta.estadoPago === 'PAGADO' && venta.totalBoletos === 0

              return (
                <TableRow key={venta.id}>
                  <TableCell className='font-medium tabular-nums'>
                    {venta.numeroTransaccion}
                    <span className='text-muted-foreground block text-xs font-normal'>
                      {formatearFechaHora(venta.fechaVenta)}
                    </span>
                  </TableCell>

                  {!compacta && (
                    <TableCell>
                      {venta.cliente
                        ? `${venta.cliente.nombre} ${venta.cliente.apellido}`.trim()
                        : 'Sin datos'}
                    </TableCell>
                  )}

                  <TableCell>{venta.empresaNombre}</TableCell>

                  {!compacta && (
                    <TableCell className='text-sm'>
                      {venta.origenNombre} → {venta.destinoNombre}
                      <span className='text-muted-foreground block text-xs'>
                        {formatearFecha(venta.fechaViaje)} {venta.horaSalida}
                      </span>
                    </TableCell>
                  )}

                  <TableCell>
                    <Badge variant={VARIANTE_ESTADO[venta.estadoPago]}>
                      {ETIQUETAS_ESTADO_PAGO[venta.estadoPago]}
                    </Badge>
                    <span className='text-muted-foreground mt-0.5 block text-xs'>
                      {ETIQUETAS_ESTADO_VENTA[venta.estadoVenta]} ·{' '}
                      {ETIQUETAS_METODO_PAGO[venta.metodoPago]}
                    </span>
                  </TableCell>

                  <TableCell className='text-end tabular-nums'>
                    {sinBoleto ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={cn(
                              'font-semibold text-[var(--estado-critico)]',
                              'cursor-help underline decoration-dotted underline-offset-4',
                            )}
                          >
                            0
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Cobrada sin boleto emitido. El cliente pagó y no tiene
                          pasaje.
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      venta.totalBoletos
                    )}
                  </TableCell>

                  <TableCell className='text-end tabular-nums'>
                    {formatearGuaranies(desglose.pasaje)}
                  </TableCell>
                  <TableCell className='text-end tabular-nums'>
                    {formatearGuaranies(desglose.cargoServicio)}
                  </TableCell>
                  <TableCell className='text-end font-medium tabular-nums'>
                    {formatearGuaranies(desglose.cobradoAlCliente)}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TooltipProvider>
    </div>
  )
}
