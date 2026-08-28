import { Download, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useDescargarFactura } from '../hooks/use-caja'
import { LosDocumentosDeLaVenta } from './los-documentos-de-la-venta'

/**
 * Los documentos de una venta ya hecha.
 *
 * El boleto de cada pasajero, una factura por pasaje —la transportista factura
 * cada boleto por separado— y un solo comprobante del cargo por servicio, que
 * Pasaje Online cobra una vez.
 *
 * El listado y la vista previa viven en `LosDocumentosDeLaVenta`, porque son los
 * mismos que ve el vendedor al terminar la venta: si acá se pudiera abrir un
 * documento y allá no, sería la misma pantalla contando dos cosas distintas.
 *
 * Lo que este modal agrega es la impresión de la venta entera, que sólo tiene
 * sentido sobre una venta cerrada.
 */
export function ModalDeFacturas({
  numeroTransaccion,
  onClose,
}: {
  numeroTransaccion: string | null
  onClose: () => void
}) {
  const descargar = useDescargarFactura()

  return (
    <Dialog open={!!numeroTransaccion} onOpenChange={(abierto) => !abierto && onClose()}>
      {/*
        Ancho, porque adentro hay dos columnas: la lista de documentos y el
        documento abierto. En 3xl el visor quedaba tan angosto que un boleto
        A4 se leía a la mitad del tamaño de la letra.
      */}
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-6xl'>
        <DialogHeader>
          <DialogTitle>Documentos de la venta</DialogTitle>
          <DialogDescription className='font-mono text-xs'>
            {numeroTransaccion}
          </DialogDescription>
        </DialogHeader>

        <LosDocumentosDeLaVenta numeroTransaccion={numeroTransaccion} />

        {/*
          Las dos impresiones conviven: se le imprime el térmico al cliente que
          está enfrente, y la A4 queda para el archivo. No son alternativas.
        */}
        {numeroTransaccion && (
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
