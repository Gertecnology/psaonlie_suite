import { useEffect, useRef } from 'react'
import { avisarQueSigoTrabajando } from '../services/sales.service'

/**
 * Cada cuánto se avisa, como mucho.
 *
 * El backend tolera diez minutos sin señales, así que un latido por minuto
 * deja nueve de margen para uno que se pierda. Mandarlo en cada tecla serían
 * cientos de llamadas por venta para decir siempre lo mismo.
 */
const CADA_MS = 60 * 1000

/** Cuánto se espera antes de volver a mirar el mouse. */
const MOUSE_CADA_MS = 5 * 1000

/**
 * Le avisa al backend que el vendedor sigue trabajando.
 *
 * La regla es del usuario: «mientras esté trabajando se renueva y si no se
 * libera». Sin esto, renovar no tiene tope y una pestaña abierta y olvidada
 * retiene butacas ajenas media hora, con una llamada al web service de la
 * transportista por cada renovación.
 *
 * **Qué cuenta como trabajar**: una tecla en cualquier campo, un clic, y el
 * mouse moviéndose sobre la pantalla. El movimiento entra a propósito: el caso
 * que aprieta es el vendedor atendiendo mientras el cliente busca la cédula, y
 * eso es trabajo real sin una sola tecla.
 *
 * **Qué no cuenta**: la pestaña en segundo plano. Una ventana abierta detrás de
 * otra cosa no es alguien vendiendo.
 */
export function useAvisarQueSigoTrabajando({
  codigoReferencia,
  activa,
}: {
  codigoReferencia?: string | null
  activa: boolean
}) {
  const huboActividad = useRef(false)
  const ultimoMouse = useRef(0)

  useEffect(() => {
    if (!codigoReferencia || !activa) return

    const anotar = () => {
      huboActividad.current = true
    }

    // El mouse dispara decenas de eventos por segundo; alcanza con mirarlo de
    // a ratos para saber que hay alguien del otro lado.
    const anotarElMouse = () => {
      const ahora = Date.now()
      if (ahora - ultimoMouse.current < MOUSE_CADA_MS) return
      ultimoMouse.current = ahora
      huboActividad.current = true
    }

    window.addEventListener('keydown', anotar)
    window.addEventListener('pointerdown', anotar)
    window.addEventListener('pointermove', anotarElMouse, { passive: true })

    // Reservar ya contó como actividad del lado del backend, así que el primer
    // latido recién sale al minuto.
    const latido = setInterval(() => {
      if (!huboActividad.current) return
      // Una pestaña detrás de otra cosa no es alguien vendiendo, por más que
      // el mouse haya pasado por encima.
      if (document.visibilityState !== 'visible') return

      huboActividad.current = false
      void avisarQueSigoTrabajando(codigoReferencia)
    }, CADA_MS)

    return () => {
      window.removeEventListener('keydown', anotar)
      window.removeEventListener('pointerdown', anotar)
      window.removeEventListener('pointermove', anotarElMouse)
      clearInterval(latido)
    }
  }, [codigoReferencia, activa])
}
