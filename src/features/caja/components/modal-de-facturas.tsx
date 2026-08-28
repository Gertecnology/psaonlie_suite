import { AlertTriangle, Download, Printer } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatearFechaHora } from '@/lib/formato'
import { useDescargarFactura, useFacturasDeLaVenta } from '../hooks/use-caja'

/**
 * Los documentos fiscales de una venta.
 *
 * Una factura por pasaje —la transportista factura cada boleto por separado— y
 * un solo comprobante del cargo por servicio, que Pasaje Online cobra una vez.
 *
 * Y arriba de todo, el aviso cuando no son fiscales de verdad. Eso pasa hoy en
 * todos: la transportista responde `Boleto_FE: N` y no manda timbrado, CDC ni
 * QR. El documento reproduce la venta, pero archivarlo creyendo que es una
 * factura ante la SET es un problema del contador, no del sistema — así que la
 * pantalla lo dice.
 */
export function ModalDeFacturas({
  numeroTransaccion,
  onClose,
}: {
  numeroTransaccion: string | null
  onClose: () => void
}) {
  const { data: facturas, isLoading, error } = useFacturasDeLaVenta(numeroTransaccion)
  const descargar = useDescargarFactura()

  const ningunaEsFiscal = facturas?.length ? facturas.every((f) => !f.esFiscal) : false

  return (
    <Dialog open={!!numeroTransaccion} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className='max-h-[85vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Documentos de la venta</DialogTitle>
          <DialogDescription className='font-mono text-xs'>
            {numeroTransaccion}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className='h-32 w-full' />}

        {error && (
          <p className='text-destructive text-sm'>{(error as Error).message}</p>
        )}

        {ningunaEsFiscal && (
          <div className='flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
            <p>
              La transportista todavía no informa timbrado, CDC ni código QR.
              Estos documentos reproducen la venta, pero{' '}
              <strong>no son facturas ante la SET</strong>.
            </p>
          </div>
        )}

        {facturas?.length === 0 && (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            Esta venta todavía no tiene documentos generados.
          </p>
        )}

        <div className='grid gap-2'>
          {facturas?.map((factura) => (
            <div
              key={factura.id}
              className='flex flex-wrap items-center justify-between gap-3 rounded-md border p-3'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-medium'>
                  {factura.tipo === 'CARGO_SERVICIO'
                    ? 'Cargo por servicio'
                    : `Factura del pasaje ${factura.numeroBoleto ?? ''}`}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {factura.razonSocial ?? 'Sin razón social'}
                  {factura.documento && ` · ${factura.documento}`}
                  {' · '}
                  {formatearFechaHora(factura.emitidaEn)}
                </p>
              </div>

              <Badge variant={factura.esFiscal ? 'default' : 'outline'}>
                {factura.esFiscal ? 'Fiscal' : 'No fiscal'}
              </Badge>
            </div>
          ))}
        </div>

        {/*
          Las dos impresiones conviven: se le imprime el térmico al cliente que
          está enfrente, y la A4 queda para el archivo. No son alternativas.
        */}
        {!!facturas?.length && numeroTransaccion && (
          <div className='flex flex-wrap gap-2 border-t pt-3'>
            <Button
              variant='outline'
              size='sm'
              disabled={descargar.isPending}
              onClick={() =>
                descargar.mutate({ numeroTransaccion, tipoImpresion: 'NORMAL' })
              }
            >
              <Download className='mr-2 h-4 w-4' />
              Descargar A4
            </Button>

            <Button
              variant='outline'
              size='sm'
              disabled={descargar.isPending}
              onClick={() =>
                descargar.mutate({ numeroTransaccion, tipoImpresion: 'TERMICA' })
              }
            >
              <Printer className='mr-2 h-4 w-4' />
              Ticket térmico
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
