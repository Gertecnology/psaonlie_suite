import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatearGuaranies } from '@/lib/formato'
import { useBoletosDeLaVenta } from '../hooks/use-caja'

/**
 * Los boletos de una venta.
 *
 * El pasajero es el congelado en el boleto —el nombre con el que viajó— y no la
 * ficha del cliente, que pudo haber cambiado después. Es el nombre que figura
 * en el papel que tiene en la mano, y el que le van a controlar al subir.
 */
export function ModalDeBoletos({
  numeroTransaccion,
  onClose,
}: {
  numeroTransaccion: string | null
  onClose: () => void
}) {
  const { data: boletos, isLoading, error } = useBoletosDeLaVenta(numeroTransaccion)

  return (
    <Dialog open={!!numeroTransaccion} onOpenChange={(abierto) => !abierto && onClose()}>
      <DialogContent className='max-h-[85vh] max-w-3xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Boletos de la venta</DialogTitle>
          <DialogDescription className='font-mono text-xs'>
            {numeroTransaccion}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className='h-40 w-full' />}

        {error && (
          <p className='text-destructive text-sm'>{(error as Error).message}</p>
        )}

        {boletos?.length === 0 && (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            Esta venta no tiene boletos emitidos.
          </p>
        )}

        <div className='grid gap-3'>
          {boletos?.map((boleto) => (
            <div key={boleto.id} className='rounded-md border p-3'>
              <div className='flex flex-wrap items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <p className='font-medium'>{boleto.pasajero ?? 'Sin nombre'}</p>
                  <p className='text-muted-foreground font-mono text-xs'>
                    {boleto.documento ?? 'sin documento'} · boleto{' '}
                    {boleto.numeroBoleto}
                  </p>
                </div>

                <Badge variant={boleto.estado === 'ANULADO' ? 'destructive' : 'default'}>
                  {boleto.estado}
                </Badge>
              </div>

              <div className='text-muted-foreground mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs'>
                <span>
                  {boleto.origen ?? '—'} → {boleto.destino ?? '—'}
                </span>
                <span>
                  {boleto.fechaViaje ?? '—'} {boleto.horaSalida ?? ''}
                </span>
                <span>Butaca {boleto.asiento}</span>
                <span className='font-medium text-foreground tabular-nums'>
                  {formatearGuaranies(boleto.tarifa)}
                </span>
              </div>

              {/*
                Lo que la transportista devolvería y hasta cuándo lo acepta. Se
                muestra tal como lo informa ella: un número calculado por
                nosotros le prometería al cliente algo que puede no reconocer.
              */}
              {boleto.importeADevolver !== undefined && (
                <p className='text-muted-foreground mt-2 border-t pt-2 text-xs'>
                  La transportista devuelve{' '}
                  <span className='text-foreground font-medium tabular-nums'>
                    {formatearGuaranies(boleto.importeADevolver)}
                  </span>
                  {boleto.plazoAnulacionHoras !== undefined && (
                    <> hasta {boleto.plazoAnulacionHoras} h antes de la salida</>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
