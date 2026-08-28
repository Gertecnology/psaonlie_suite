import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

import { apiFetch } from '@/utils/api-client'

/**
 * El formulario de Bancard, dentro del panel.
 *
 * Es el mismo que usa la landing: se pide un `processId` al backend y el SDK de
 * Bancard dibuja su propio iframe. Los datos de la tarjeta nunca pasan por
 * nuestro código —ni por el navegador del vendedor, más allá de ese iframe— que
 * es justamente el punto de usar la pasarela.
 *
 * En la caja lo abre el vendedor y el cliente escribe ahí. El cobro se confirma
 * solo, por el callback de Bancard: nadie tiene que marcar la venta como pagada
 * a mano.
 */

/** Lo que devuelve `/api/pagos/bancard/iniciar`. */
interface ProcesoIniciado {
  processId?: string
  process_id?: string
}

declare global {
  interface Window {
    Bancard?: {
      Checkout?: {
        createForm: (
          contenedorId: string,
          processId: string,
          opciones?: Record<string, unknown>,
        ) => void
      }
    }
  }
}

interface Props {
  ventaId: string
  /** Se llama cuando Bancard dibujó el formulario y el cliente puede pagar. */
  onListo?: () => void
  onError?: (mensaje: string) => void
}

export function BancardCheckout({ ventaId, onListo, onError }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const contenedor = useRef<HTMLDivElement>(null)

  /**
   * Evita pedir dos `processId` para la misma venta.
   *
   * En desarrollo el efecto corre dos veces por el StrictMode, y cada `iniciar`
   * abre una operación en Bancard: sin esto quedarían dos abiertas por venta.
   */
  const yaIniciado = useRef(false)

  useEffect(() => {
    if (yaIniciado.current || !ventaId) return
    yaIniciado.current = true

    let vigente = true

    const fallar = (mensaje: string) => {
      if (!vigente) return
      setError(mensaje)
      setCargando(false)
      onError?.(mensaje)
    }

    const dibujar = (processId: string, intento = 0) => {
      if (!vigente) return

      // El SDK se carga por script aparte y el contenedor se monta con React:
      // ninguno de los dos está garantizado en el primer intento.
      if (!window.Bancard?.Checkout || !contenedor.current) {
        if (intento >= 10) {
          fallar('El formulario de Bancard no se pudo cargar. Probá recargar.')
          return
        }

        setTimeout(() => dibujar(processId, intento + 1), 500)
        return
      }

      try {
        contenedor.current.innerHTML = ''
        const id = `bancard-${ventaId}`
        contenedor.current.id = id

        window.Bancard.Checkout.createForm(id, processId)

        setCargando(false)
        onListo?.()
      } catch {
        fallar('No se pudo dibujar el formulario de pago.')
      }
    }

    const cargarSdk = () =>
      new Promise<void>((resolver, rechazar) => {
        if (window.Bancard?.Checkout) {
          resolver()
          return
        }

        const url = import.meta.env.VITE_BANCARD_SDK_URL

        if (!url) {
          rechazar(new Error('Falta VITE_BANCARD_SDK_URL en el entorno.'))
          return
        }

        // Si el script ya está en la página —otra venta antes— se espera a que
        // termine en vez de agregarlo dos veces.
        const existente = document.querySelector<HTMLScriptElement>(
          'script[data-bancard]',
        )

        if (existente) {
          existente.addEventListener('load', () => resolver())
          existente.addEventListener('error', () =>
            rechazar(new Error('El SDK de Bancard no cargó.')),
          )
          return
        }

        const script = document.createElement('script')
        script.src = url
        script.async = true
        script.dataset.bancard = 'true'
        script.onload = () => resolver()
        script.onerror = () => rechazar(new Error('El SDK de Bancard no cargó.'))
        document.body.appendChild(script)
      })

    apiFetch<ProcesoIniciado>('/api/pagos/bancard/iniciar', {
      method: 'POST',
      body: JSON.stringify({ ventaId }),
      fallbackMessage: 'No se pudo iniciar el pago con Bancard.',
    })
      .then(async (respuesta) => {
        const processId = respuesta?.processId ?? respuesta?.process_id

        if (!processId) {
          throw new Error('Bancard no devolvió el identificador del proceso.')
        }

        await cargarSdk()
        dibujar(processId)
      })
      .catch((problema: Error) => fallar(problema.message))

    return () => {
      vigente = false
    }
    // Sólo `ventaId`: agregar los callbacks reiniciaría el pago en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaId])

  if (error) {
    return (
      <div className='flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm'>
        <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-destructive' />
        <div>
          <p className='font-medium'>No se pudo abrir el pago con tarjeta</p>
          <p className='text-muted-foreground mt-1 text-xs'>{error}</p>
          <p className='text-muted-foreground mt-2 text-xs'>
            La venta quedó reservada. Se puede cobrar por otro medio desde el
            listado, o reintentar acá.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='grid gap-3'>
      {cargando && (
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Loader2 className='h-4 w-4 animate-spin' />
          Abriendo el formulario de Bancard…
        </div>
      )}

      {/*
        El iframe lo dibuja el SDK acá adentro. La altura mínima evita que la
        pantalla salte cuando aparece.
      */}
      <div ref={contenedor} className='min-h-[26rem] w-full' />

      <p className='text-muted-foreground text-xs'>
        Los datos de la tarjeta los recibe Bancard directamente. El cobro se
        confirma solo cuando ellos lo avisan: no hay que marcarlo a mano.
      </p>
    </div>
  )
}
