import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { apiFetch } from '@/utils/api-client'

/**
 * A nombre de quién sale la factura.
 *
 * El mismo bloque que la landing, que faltaba en la caja: sin él toda venta de
 * mostrador salía a consumidor final, y el cliente que pedía factura con su RUC
 * se iba sin ella.
 *
 * Quien viaja y quien paga no son la misma persona. Los datos de arriba son del
 * **pasajero** y van al manifiesto; estos son de quien factura, y pueden ser una
 * empresa que ni sube al ómnibus.
 */

/** Un documento más corto que esto todavía se está escribiendo. */
const LARGO_MINIMO = 5

/** Espera antes de buscar, para no consultar en cada tecla. */
const ESPERA_MS = 550

export interface DatosDeFacturacion {
  documento: string
  razonSocial: string
  email?: string
  direccion?: string
}

/**
 * Lo que devuelve `/api/facturacion/buscar`, verificado contra el servidor:
 *
 *   {"origen":"padron","estadoPadron":"ACTIVO","titular":{...}}
 *
 * `estadoPadron` va afuera de `titular`, no adentro.
 */
interface TitularEncontrado {
  origen?: 'padron' | 'libreta' | string
  estadoPadron?: string
  titular?: {
    tipoDocumento?: string
    documento?: string
    razonSocial?: string
    email?: string
    direccion?: string
  }
}

interface Props {
  valor: DatosDeFacturacion
  onChange: (datos: DatosDeFacturacion) => void
  deshabilitado?: boolean
}

export function FacturacionCard({ valor, onChange, deshabilitado }: Props) {
  const [buscando, setBuscando] = useState(false)
  const [avisoPadron, setAvisoPadron] = useState<string | null>(null)

  const documentoDiferido = useDebouncedValue(valor.documento, ESPERA_MS)

  /** El último documento buscado: sin esto se repite la consulta en cada render. */
  const yaBuscado = useRef('')

  useEffect(() => {
    const documento = documentoDiferido.trim()

    if (documento.length < LARGO_MINIMO || documento === yaBuscado.current) {
      return
    }

    yaBuscado.current = documento
    let vigente = true

    setBuscando(true)
    setAvisoPadron(null)

    apiFetch<TitularEncontrado>(
      `/api/facturacion/buscar?documento=${encodeURIComponent(documento)}`,
      { fallbackMessage: 'No se pudo consultar el documento.' },
    )
      .then((respuesta) => {
        // El documento cambió mientras respondía: esto ya es de otro.
        if (!vigente || documento !== yaBuscado.current) return

        const titular = respuesta?.titular

        if (titular?.razonSocial) {
          onChange({
            documento: titular.documento ?? documento,
            razonSocial: titular.razonSocial,
            email: titular.email ?? valor.email,
            direccion: titular.direccion ?? valor.direccion,
          })
        }

        if (respuesta?.estadoPadron && respuesta.estadoPadron !== 'ACTIVO') {
          setAvisoPadron(
            `El padrón lo informa como ${respuesta.estadoPadron}. La factura ` +
              'se emite igual, pero conviene avisarle al cliente.',
          )
        }
      })
      .catch(() => {
        // Que no se pueda consultar el padrón no frena la venta: los datos se
        // escriben a mano, como se hacía siempre.
      })
      .finally(() => {
        if (vigente) setBuscando(false)
      })

    return () => {
      vigente = false
    }
    // `valor` completo dispararía en cada tecla de cualquier campo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentoDiferido])

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-base'>Datos de facturación</CardTitle>
        <p className='text-muted-foreground text-sm'>
          A nombre de quién sale la factura. Puede ser distinto de quien viaja.
        </p>
      </CardHeader>

      <CardContent className='grid gap-4 sm:grid-cols-2'>
        <div className='grid gap-2'>
          <Label htmlFor='facturacion-documento'>
            RUC o documento <span className='text-red-500'>*</span>
          </Label>
          <div className='relative'>
            <Input
              id='facturacion-documento'
              value={valor.documento}
              disabled={deshabilitado}
              autoComplete='off'
              placeholder='4969917-2'
              onChange={(evento) =>
                onChange({ ...valor, documento: evento.target.value })
              }
            />
            {buscando && (
              <Loader2 className='text-muted-foreground absolute right-2.5 top-2.5 h-4 w-4 animate-spin' />
            )}
          </div>
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='facturacion-razon'>
            Razón social o nombre <span className='text-red-500'>*</span>
          </Label>
          <Input
            id='facturacion-razon'
            value={valor.razonSocial}
            disabled={deshabilitado}
            autoComplete='off'
            onChange={(evento) =>
              onChange({ ...valor, razonSocial: evento.target.value })
            }
          />
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='facturacion-email'>Correo para la factura</Label>
          <Input
            id='facturacion-email'
            type='email'
            value={valor.email ?? ''}
            disabled={deshabilitado}
            autoComplete='off'
            onChange={(evento) =>
              onChange({ ...valor, email: evento.target.value })
            }
          />
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='facturacion-direccion'>Dirección</Label>
          <Input
            id='facturacion-direccion'
            value={valor.direccion ?? ''}
            disabled={deshabilitado}
            autoComplete='off'
            onChange={(evento) =>
              onChange({ ...valor, direccion: evento.target.value })
            }
          />
        </div>

        {avisoPadron && (
          <div className='flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs sm:col-span-2'>
            <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-amber-600' />
            <p>{avisoPadron}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
