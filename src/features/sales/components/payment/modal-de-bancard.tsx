import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { BancardCheckout } from './bancard-checkout'

/**
 * La pasarela de Bancard, en un modal.
 *
 * Con tarjeta el cobro no se registra a mano: lo confirma el callback de
 * Bancard cuando el pago pasa. Ofrecer un botón de «Confirmar cobro» para una
 * venta con tarjeta dejaría marcar como cobrada una venta que nunca se cobró.
 *
 * Va en modal porque el vendedor le acerca la pantalla al cliente para que
 * escriba su tarjeta, y después vuelve a lo suyo: es un paso aparte, no algo
 * que deba quedar mezclado con el resto de la venta.
 *
 * Los datos de la tarjeta nunca pasan por nuestro código: el SDK dibuja su
 * propio iframe.
 */
export function ModalDeBancard({
  ventaId,
  titulo,
  abierto,
  onClose,
  onError,
}: {
  ventaId: string | null
  /** Qué se está cobrando. En ida y vuelta hay una venta por tramo. */
  titulo?: string
  abierto: boolean
  onClose: () => void
  onError?: (mensaje: string) => void
}) {
  return (
    <Dialog open={abierto} onOpenChange={(sigue) => !sigue && onClose()}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>
            {titulo ? `Pago con tarjeta · ${titulo}` : 'Pago con tarjeta'}
          </DialogTitle>
          <DialogDescription>
            Acercale la pantalla al cliente. El cobro se confirma solo cuando
            Bancard lo avisa: no hay que marcarlo a mano.
          </DialogDescription>
        </DialogHeader>

        {/* Sólo se monta con el modal abierto: montarlo antes abriría un
            proceso en Bancard por cada venta que se mire. */}
        {abierto && ventaId && (
          <BancardCheckout ventaId={ventaId} onError={onError} />
        )}
      </DialogContent>
    </Dialog>
  )
}
