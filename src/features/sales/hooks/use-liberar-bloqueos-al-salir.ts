import { useEffect, useRef } from 'react'
import { liberarBloqueo } from '../services/sales.service'

export interface BloqueoLiberable {
  codigoReferencia?: string | null
  /**
   * `true` mientras el bloqueo siga siendo nuestro y no tenga venta asociada.
   * `false` en cuanto la venta se confirme, o mientras se navega a otro paso
   * del mismo flujo: esos asientos todavía hacen falta.
   */
  activo: boolean
}

/**
 * Libera los bloqueos de asientos cuando el operador abandona la venta.
 *
 * Sin esto, cerrar la pestaña o irse a otra sección deja los asientos
 * retenidos 30 minutos en el sistema de la empresa: no se pueden vender ni por
 * el panel ni por ventanilla, y nadie sabe por qué.
 *
 * Recibe una **función** y no una lista porque el momento de liberar (el
 * `beforeunload`, o el desmontaje) llega sin que React haya vuelto a
 * renderizar. Una lista calculada en el render anterior estaría vencida justo
 * cuando importa: por ejemplo al navegar al checkout, donde la pantalla marca
 * el bloqueo como "todavía necesario" un instante antes de irse.
 *
 * `keepalive` permite que la request sobreviva al cierre de la pestaña; es la
 * única forma de liberar en `beforeunload` conservando el header de
 * autorización (`navigator.sendBeacon` no admite headers).
 */
export function useLiberarBloqueosAlSalir(
  obtenerBloqueos: () => BloqueoLiberable[],
) {
  // Ref para que el handler llame siempre a la versión actual sin
  // re-suscribirse al evento en cada render.
  const obtenerBloqueosRef = useRef(obtenerBloqueos)
  obtenerBloqueosRef.current = obtenerBloqueos

  useEffect(() => {
    const liberarPendientes = (keepalive: boolean) => {
      for (const bloqueo of obtenerBloqueosRef.current()) {
        if (!bloqueo.activo || !bloqueo.codigoReferencia) continue

        // Best-effort: si falla, el bloqueo expira solo a los 30 minutos.
        void liberarBloqueo(bloqueo.codigoReferencia, { keepalive }).catch(
          () => undefined,
        )
      }
    }

    const alCerrarPestana = () => liberarPendientes(true)
    window.addEventListener('beforeunload', alCerrarPestana)

    return () => {
      window.removeEventListener('beforeunload', alCerrarPestana)
      liberarPendientes(false)
    }
  }, [])
}
