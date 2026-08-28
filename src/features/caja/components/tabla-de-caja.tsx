import { Ban, FileText, Mail, Ticket } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  formatearFechaHora,
  formatearGuaranies,
  formatearPorcentaje,
} from '@/lib/formato'
import type { FilaDeCaja } from '../models/caja.model'

/**
 * La tabla del listado de caja.
 *
 * Tiene dos formas según quién mira, y las columnas se deciden por lo que llegó
 * en los datos, no por un flag del frontend: si `cargoServicio` no vino, esa
 * persona no tiene derecho a verlo y la columna no existe.
 */

const ESTADOS: Record<string, { texto: string; variante: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PAGADO: { texto: 'Pagado', variante: 'default' },
  PENDIENTE: { texto: 'Pendiente', variante: 'secondary' },
  EXPIRADO: { texto: 'Expirado', variante: 'outline' },
  CANCELADO: { texto: 'Cancelado', variante: 'destructive' },
  FALLIDO: { texto: 'Fallido', variante: 'destructive' },
  REEMBOLSADO: { texto: 'Reembolsado', variante: 'outline' },
}

/**
 * Estados de la VENTA que mandan sobre el del pago.
 *
 * Una venta anulada sigue teniendo `estadoPago: PAGADO` —el dinero se cobró de
 * verdad, y el reembolso es otro hecho— así que mostrar sólo el estado del pago
 * pintaba «Pagado» sobre una venta cancelada. Quien mira el listado pregunta
 * primero si la venta vale, no si entró la plata.
 */
const VENTA_MANDA: Record<string, { texto: string; variante: 'destructive' | 'outline' }> = {
  CANCELADO: { texto: 'Anulada', variante: 'destructive' },
  EXPIRADO: { texto: 'Expirada', variante: 'outline' },
}

function EstadoDeLaVenta({
  estadoPago,
  estadoVenta,
}: {
  estadoPago: string
  estadoVenta: string
}) {
  const deLaVenta = VENTA_MANDA[estadoVenta]

  if (deLaVenta) {
    return (
      <span className='flex flex-wrap items-center gap-1'>
        <Badge variant={deLaVenta.variante}>{deLaVenta.texto}</Badge>
        {/* Y se dice que el cobro había entrado: es lo que explica que haya
            un reembolso pendiente. */}
        {estadoPago === 'PAGADO' && (
          <span className='text-muted-foreground text-xs'>cobrada</span>
        )}
      </span>
    )
  }

  const { texto, variante } = ESTADOS[estadoPago] ?? {
    texto: estadoPago,
    variante: 'outline' as const,
  }

  return <Badge variant={variante}>{texto}</Badge>
}

interface TablaDeCajaProps {
  filas: FilaDeCaja[]
  /** Si quien mira ve sólo sus ventas: cambia qué columnas tienen sentido. */
  soloMisVentas: boolean
  cargando: boolean
  onVerBoletos: (numeroTransaccion: string) => void
  onVerFacturas: (numeroTransaccion: string) => void
  onEnviar: (numeroTransaccion: string) => void
  /** Sólo se ofrece en las ventas que todavía se pueden anular. */
  onAnular: (fila: FilaDeCaja) => void
}

export function TablaDeCaja({
  filas,
  soloMisVentas,
  cargando,
  onVerBoletos,
  onVerFacturas,
  onEnviar,
  onAnular,
}: TablaDeCajaProps) {
  if (cargando) {
    return <Skeleton className='h-64 w-full' />
  }

  if (filas.length === 0) {
    return (
      <div className='text-muted-foreground rounded-md border py-16 text-center text-sm'>
        No hay ventas en este período.
      </div>
    )
  }

  return (
    // La tabla scrollea dentro de su contenedor: sin esto, en un monitor de
    // boletería la página entera se corre para el costado.
    <div className='overflow-x-auto rounded-md border'>
      <Table>
        <caption className='sr-only'>
          Ventas del período, con su cliente, empresa, estado y monto
        </caption>
        <TableHeader>
          <TableRow>
            <TableHead>Documento</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className='text-right'>Monto</TableHead>

            {soloMisVentas ? (
              <TableHead className='text-right'>Mi comisión</TableHead>
            ) : (
              <>
                <TableHead>Vendedor</TableHead>
                <TableHead className='text-right'>Cargo</TableHead>
                <TableHead className='text-right'>Comisión</TableHead>
              </>
            )}

            <TableHead className='text-right'>Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.ventaId}>
              <TableCell className='font-mono text-xs tabular-nums'>
                {fila.documentoCliente ?? '—'}
              </TableCell>

              <TableCell className='max-w-[16rem] truncate'>
                {fila.nombreCliente ?? '—'}
              </TableCell>

              <TableCell className='max-w-[12rem] truncate'>
                {fila.empresa ?? '—'}
              </TableCell>

              <TableCell className='text-muted-foreground whitespace-nowrap text-xs'>
                {formatearFechaHora(fila.fechaVenta)}
              </TableCell>

              <TableCell>
                <EstadoDeLaVenta
                  estadoPago={fila.estadoPago}
                  estadoVenta={fila.estadoVenta}
                />
              </TableCell>

              <TableCell className='text-right font-medium tabular-nums'>
                {formatearGuaranies(fila.monto)}
                <span className='text-muted-foreground ml-1 text-xs'>
                  · {fila.boletos}
                </span>
              </TableCell>

              {soloMisVentas ? (
                <TableCell className='text-right font-medium tabular-nums'>
                  {fila.miComision ? formatearGuaranies(fila.miComision) : '—'}
                </TableCell>
              ) : (
                <>
                  <TableCell className='max-w-[10rem] truncate text-sm'>
                    {/* Vacío significa que la venta salió de la web. */}
                    {fila.vendedor ?? (
                      <span className='text-muted-foreground'>Web</span>
                    )}
                  </TableCell>

                  <TableCell className='text-right tabular-nums'>
                    {formatearGuaranies(fila.cargoServicio ?? 0)}
                  </TableCell>

                  <TableCell className='text-right tabular-nums'>
                    {formatearGuaranies(fila.comisionEmpresa ?? 0)}
                    {fila.porcentajeComision !== undefined && (
                      <span className='text-muted-foreground ml-1 text-xs'>
                        {formatearPorcentaje(fila.porcentajeComision)}
                      </span>
                    )}
                  </TableCell>
                </>
              )}

              <TableCell>
                <div className='flex justify-end gap-1'>
                  <Button
                    variant='ghost'
                    size='icon'
                    title='Ver boletos'
                    aria-label={`Ver los boletos de ${fila.numeroTransaccion}`}
                    onClick={() => onVerBoletos(fila.numeroTransaccion)}
                  >
                    <Ticket className='h-4 w-4' />
                  </Button>

                  <Button
                    variant='ghost'
                    size='icon'
                    title='Ver facturas'
                    aria-label={`Ver las facturas de ${fila.numeroTransaccion}`}
                    onClick={() => onVerFacturas(fila.numeroTransaccion)}
                  >
                    <FileText className='h-4 w-4' />
                  </Button>

                  <Button
                    variant='ghost'
                    size='icon'
                    title='Enviar por correo'
                    aria-label={`Enviar los documentos de ${fila.numeroTransaccion}`}
                    onClick={() => onEnviar(fila.numeroTransaccion)}
                  >
                    <Mail className='h-4 w-4' />
                  </Button>

                  {/*
                    Sólo en las pagadas. Anular una venta que nunca se cobró no
                    devuelve nada, y ofrecerlo sugiere que sí.
                  */}
                  {fila.estadoPago === 'PAGADO' &&
                    fila.estadoVenta !== 'CANCELADO' && (
                    <Button
                      variant='ghost'
                      size='icon'
                      title='Anular'
                      aria-label={`Anular la venta ${fila.numeroTransaccion}`}
                      onClick={() => onAnular(fila)}
                    >
                      <Ban className='text-destructive h-4 w-4' />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
