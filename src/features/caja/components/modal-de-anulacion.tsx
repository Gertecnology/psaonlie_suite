import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAnularVenta } from '../hooks/use-caja'

/** Un motivo de una palabra no explica nada dentro de tres meses. */
const MOTIVO_MINIMO = 10

/**
 * Anular una venta.
 *
 * Mueve plata: le devuelve al cliente, revierte lo que se le debía a la
 * transportista y le quita al vendedor su comisión. Por eso pide un motivo
 * escrito y no un simple «¿seguro?» — el motivo queda en el asiento, y es lo
 * único que va a explicar la anulación cuando alguien la audite.
 *
 * Quién puede anular qué lo decide el backend. Si devuelve 403, su mensaje dice
 * a quién pedírselo, y se muestra tal cual.
 */
export function ModalDeAnulacion({
  venta,
  onClose,
}: {
  venta: { ventaId: string; numeroTransaccion: string; monto: string } | null
  onClose: () => void
}) {
  const [motivo, setMotivo] = useState('')
  const anular = useAnularVenta()

  const motivoCorto = motivo.trim().length < MOTIVO_MINIMO

  const cerrar = () => {
    setMotivo('')
    onClose()
  }

  const confirmar = () => {
    if (!venta || motivoCorto) return

    anular.mutate(
      { ventaId: venta.ventaId, motivo: motivo.trim() },
      { onSuccess: cerrar },
    )
  }

  return (
    <Dialog open={!!venta} onOpenChange={(abierto) => !abierto && cerrar()}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Anular la venta</DialogTitle>
          <DialogDescription className='font-mono text-xs'>
            {venta?.numeroTransaccion}
          </DialogDescription>
        </DialogHeader>

        <div className='flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs'>
          <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-destructive' />
          <p>
            Se le devuelve <strong>{venta?.monto}</strong> al cliente, se
            revierte lo que se le debía a la transportista y se le quita al
            vendedor su comisión. El plazo y el importe los decide la
            transportista.
          </p>
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='motivo-anulacion'>Motivo</Label>
          <Textarea
            id='motivo-anulacion'
            rows={3}
            placeholder='Por qué se anula. Queda escrito en el asiento.'
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            aria-describedby='motivo-ayuda'
          />
          <p id='motivo-ayuda' className='text-muted-foreground text-xs'>
            {motivoCorto
              ? `Al menos ${MOTIVO_MINIMO} caracteres: dentro de tres meses este texto es lo único que va a explicar la anulación.`
              : 'Queda en el asiento contable.'}
          </p>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={cerrar} disabled={anular.isPending}>
            Cancelar
          </Button>
          <Button
            variant='destructive'
            onClick={confirmar}
            disabled={anular.isPending || motivoCorto}
          >
            {anular.isPending ? 'Anulando…' : 'Anular'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
