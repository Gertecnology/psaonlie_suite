import { useState } from 'react'
import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useEnviarDocumentos } from '../hooks/use-caja'

/** Una dirección de correo con forma de tal. */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * A dónde mandar los documentos.
 *
 * Sirve para las dos cosas: el envío de la caja —donde nada sale solo, porque
 * el cliente está en el mostrador— y el reenvío de una venta cuyo correo estaba
 * mal escrito o se perdió.
 *
 * Dejarlo vacío manda cada documento a quien le corresponde: quien compró
 * recibe todo y cada pasajero su boleto. Escribir una dirección manda todo ahí.
 */
export function ModalDeEnvio({
  numeroTransaccion,
  onClose,
}: {
  numeroTransaccion: string | null
  onClose: () => void
}) {
  const [correo, setCorreo] = useState('')
  const enviar = useEnviarDocumentos()

  const correoInvalido = correo.trim() !== '' && !CORREO.test(correo.trim())

  const cerrar = () => {
    setCorreo('')
    onClose()
  }

  const confirmar = () => {
    if (!numeroTransaccion || correoInvalido) return

    enviar.mutate(
      {
        numeroTransaccion,
        correoDestino: correo.trim() || undefined,
      },
      { onSuccess: cerrar },
    )
  }

  return (
    <Dialog open={!!numeroTransaccion} onOpenChange={(abierto) => !abierto && cerrar()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Enviar los documentos</DialogTitle>
          <DialogDescription>
            Boletos, facturas y comprobante del cargo por servicio.
          </DialogDescription>
        </DialogHeader>

        <form
          className='grid gap-2'
          onSubmit={(evento) => {
            // Dentro del form para que Enter mande, que es como se completa un
            // campo único cuando hay alguien esperando en el mostrador.
            evento.preventDefault()
            confirmar()
          }}
        >
          <Label htmlFor='correo-destino'>Correo</Label>
          <Input
            id='correo-destino'
            type='email'
            inputMode='email'
            autoComplete='off'
            placeholder='cliente@ejemplo.py'
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            aria-invalid={correoInvalido}
            aria-describedby='correo-ayuda'
          />
          <p id='correo-ayuda' className='text-muted-foreground text-xs'>
            {correoInvalido
              ? 'Esa dirección no tiene forma de correo.'
              : 'Si lo dejás vacío, cada documento va a quien le corresponde.'}
          </p>
        </form>

        <DialogFooter>
          <Button variant='outline' onClick={cerrar} disabled={enviar.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={confirmar}
            disabled={enviar.isPending || correoInvalido}
          >
            <Send className='mr-2 h-4 w-4' />
            {enviar.isPending ? 'Enviando…' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
