import { useState } from 'react'
import { Loader2, Mail, Printer, Receipt } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  descargarFactura,
  enviarDocumentos,
  type TipoImpresion,
} from '@/features/caja/services/caja.service'

/**
 * Entregarle al cliente lo que compró.
 *
 * Es el último paso de una venta de mostrador, y el que faltaba: la venta se
 * hacía bien y el cliente se iba sin nada. Los documentos de una venta de caja
 * **se generan recién cuando se piden** —a diferencia de la web, que los manda
 * sola—, así que sin este paso una venta quedaba sin boleto ni factura.
 *
 * Tres formas, porque en el mostrador pasa de las tres:
 *
 * - **Por correo**, si el cliente lo quiere en el teléfono.
 * - **Impresa**, en la hoja de siempre.
 * - **En ticket**, para la impresora térmica de 80 mm.
 *
 * El correo puede quedar vacío: ahí cada documento va a quien le corresponde
 * —quien compró recibe todo, cada pasajero su boleto—.
 */
export function EntregarLosDocumentos({
  numeroTransaccion,
}: {
  numeroTransaccion: string
}) {
  const [correo, setCorreo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [imprimiendo, setImprimiendo] = useState<TipoImpresion | null>(null)
  const [seEnvio, setSeEnvio] = useState(false)

  const mandarPorCorreo = async () => {
    if (enviando) return

    setEnviando(true)

    try {
      const destino = correo.trim()

      await enviarDocumentos(numeroTransaccion, destino || undefined)

      setSeEnvio(true)
      toast.success('Documentos enviados', {
        description: destino
          ? `Salieron a ${destino}.`
          : 'Cada documento fue a quien le corresponde.',
      })
    } catch (problema) {
      toast.error('No se pudieron enviar', {
        description:
          problema instanceof Error ? problema.message : 'Probá de nuevo.',
      })
    } finally {
      setEnviando(false)
    }
  }

  const imprimir = async (tipo: TipoImpresion) => {
    if (imprimiendo) return

    setImprimiendo(tipo)

    try {
      await descargarFactura(numeroTransaccion, tipo)
    } catch (problema) {
      toast.error('No se pudo generar la factura', {
        description:
          problema instanceof Error ? problema.message : 'Probá de nuevo.',
      })
    } finally {
      setImprimiendo(null)
    }
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>Entregarle los documentos</CardTitle>
        <p className='text-muted-foreground text-sm'>
          El boleto, la factura y el comprobante del cargo por servicio.
        </p>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='grid gap-2'>
          <Label htmlFor='correo-de-entrega'>Mandárselos por correo</Label>
          <div className='flex flex-wrap items-center gap-2'>
            <Input
              id='correo-de-entrega'
              type='email'
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              placeholder='cliente@ejemplo.py'
              autoComplete='off'
              disabled={enviando}
              className='w-64'
            />
            <Button onClick={mandarPorCorreo} disabled={enviando}>
              {enviando ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Mail className='mr-2 h-4 w-4' />
              )}
              {seEnvio ? 'Volver a enviar' : 'Enviar'}
            </Button>
          </div>
          <p className='text-muted-foreground text-xs'>
            Si lo dejás vacío, cada documento va a quien le corresponde.
          </p>
        </div>

        <Separator />

        <div className='grid gap-2'>
          <span className='text-sm font-medium'>O imprimírselos</span>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              onClick={() => imprimir('NORMAL')}
              disabled={imprimiendo !== null}
            >
              {imprimiendo === 'NORMAL' ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Printer className='mr-2 h-4 w-4' />
              )}
              En hoja
            </Button>

            <Button
              variant='outline'
              onClick={() => imprimir('TERMICA')}
              disabled={imprimiendo !== null}
            >
              {imprimiendo === 'TERMICA' ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Receipt className='mr-2 h-4 w-4' />
              )}
              En ticket
            </Button>
          </div>
          <p className='text-muted-foreground text-xs'>
            El ticket sale en 80 mm, para la impresora térmica.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
