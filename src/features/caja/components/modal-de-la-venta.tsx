import { Download, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDescargarFactura } from '../hooks/use-caja'
import { LosBoletosDeLaVenta } from './los-boletos-de-la-venta'
import { LosDocumentosDeLaVenta } from './los-documentos-de-la-venta'

/**
 * Todo lo de una venta, en un solo lugar.
 *
 * Antes eran dos modales con dos íconos en la fila: uno abría los boletos y
 * otro los documentos. Para quien mira la tabla son dos íconos que dicen «acá
 * hay algo de esta venta» sin explicar cuál es cuál, y hay que abrir los dos
 * para saber. Ahora es un ícono y dos pestañas, que sí se leen.
 *
 * Las dos pestañas no muestran lo mismo:
 *
 * - **Documentos** son los archivos: el boleto en PDF, la factura de cada
 *   pasaje y el comprobante del cargo por servicio. Es lo que se imprime o se
 *   manda.
 * - **Boletos** son los datos del viaje: quién viaja, a dónde, en qué butaca,
 *   y cuánto devuelve la transportista si se anula. Eso hace falta *antes* de
 *   anular, y no está en ningún PDF.
 *
 * El listado de documentos vive en `LosDocumentosDeLaVenta` porque es el mismo
 * que ve el vendedor al terminar la venta: si acá se pudiera abrir uno y allá
 * no, sería la misma pantalla contando dos cosas distintas.
 */
export function ModalDeLaVenta({
  numeroTransaccion,
  onClose,
}: {
  numeroTransaccion: string | null
  onClose: () => void
}) {
  const descargar = useDescargarFactura()

  return (
    <Dialog
      open={!!numeroTransaccion}
      onOpenChange={(abierto) => !abierto && onClose()}
    >
      {/*
        Ancho, porque la pestaña de documentos tiene dos columnas: la lista y
        el documento abierto. En 3xl el visor quedaba tan angosto que un boleto
        A4 se leía a la mitad del tamaño de la letra.
      */}
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-6xl'>
        <DialogHeader>
          <DialogTitle>La venta</DialogTitle>
          <DialogDescription className='font-mono text-xs'>
            {numeroTransaccion}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue='documentos'>
          <TabsList>
            <TabsTrigger value='documentos'>Documentos</TabsTrigger>
            <TabsTrigger value='boletos'>Boletos</TabsTrigger>
          </TabsList>

          <TabsContent value='documentos' className='mt-3'>
            <LosDocumentosDeLaVenta numeroTransaccion={numeroTransaccion} />
          </TabsContent>

          {/*
            Los boletos se piden recién al abrir su pestaña: `useBoletosDeLaVenta`
            queda deshabilitado mientras `numeroTransaccion` es null, y el
            componente no se monta hasta que la pestaña se muestra.
          */}
          <TabsContent value='boletos' className='mt-3'>
            <LosBoletosDeLaVenta numeroTransaccion={numeroTransaccion} />
          </TabsContent>
        </Tabs>

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
