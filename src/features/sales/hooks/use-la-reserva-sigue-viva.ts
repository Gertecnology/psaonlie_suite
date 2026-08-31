import { useCallback, useEffect, useRef } from 'react'
import { consultarEstadoDelBloqueo } from '../services/sales.service'

interface Opciones {
  codigoReferencia?: string | null
  /** Fecha ISO de vencimiento, para saber cuándo llegar a cero. */
  expiraEn?: string | null
  /** `false` en cuanto la venta se confirma: esas butacas ya no son un bloqueo. */
  activa: boolean
  /** Se llama una sola vez, cuando el backend dice que la reserva se perdió. */
  onSeSoltaron: () => void
}

/**
 * Verifica contra el backend si la reserva sigue en pie.
 *
 * El contador de la pantalla es sólo visual: el reloj de la máquina puede estar
 * corrido, la pestaña pudo estar suspendida mientras el vendedor atendía a otro
 * cliente, y la reserva puede haberse soltado desde otro lado. La única
 * autoridad es el backend.
 *
 * Se consulta en cuatro momentos, que son los que importan:
 *
 *  1. **Al montar** — se vuelve a una venta que quedó abierta.
 *  2. **Al volver el foco** — la pestaña estuvo en segundo plano y los
 *     `setTimeout` del navegador se ralentizan o se suspenden.
 *  3. **Al llegar a cero** — el momento obvio.
 *  4. **Antes de confirmar** — con `verificarAhora()`. Es el más importante:
 *     evita emitir un boleto contra butacas que ya no tenemos.
 *
 * No hace falta socket para esto. Un sondeo constante sería una llamada por
 * segundo por vendedor para saber algo que casi nunca cambia.
 */
export function useLaReservaSigueViva({
  codigoReferencia,
  expiraEn,
  activa,
  onSeSoltaron,
}: Opciones) {
  // El aviso se da una sola vez por reserva: dos toasts encimados sobre la
  // misma pérdida no agregan nada.
  const yaAvisado = useRef(false)
  const onSeSoltaronRef = useRef(onSeSoltaron)
  onSeSoltaronRef.current = onSeSoltaron

  useEffect(() => {
    yaAvisado.current = false
  }, [codigoReferencia])

  const verificar = useCallback(async (): Promise<boolean> => {
    if (!codigoReferencia || !activa) return true

    try {
      const estado = await consultarEstadoDelBloqueo(codigoReferencia)

      // `null` es un 404: esa reserva no existe. Para quien vende es lo mismo
      // que haberla perdido.
      const sigue = estado?.vivo === true

      if (!sigue && !yaAvisado.current) {
        yaAvisado.current = true
        onSeSoltaronRef.current()
      }

      return sigue
    } catch {
      // Un fallo de red no es una reserva perdida. Decir que se soltó cuando
      // no se sabe hace tirar a la basura media hora de carga por un parpadeo
      // de la conexión.
      return true
    }
  }, [codigoReferencia, activa])

  // 1 y 2: al montar, y cada vez que la pestaña vuelve al frente.
  useEffect(() => {
    if (!codigoReferencia || !activa) return

    void verificar()

    const alVolver = () => {
      if (document.visibilityState === 'visible') void verificar()
    }

    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('focus', alVolver)

    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('focus', alVolver)
    }
  }, [codigoReferencia, activa, verificar])

  // 3: al llegar a cero. Se espera al vencimiento en vez de sondear.
  useEffect(() => {
    if (!codigoReferencia || !activa || !expiraEn) return

    const vencimiento = new Date(expiraEn).getTime()
    if (Number.isNaN(vencimiento)) return

    // Un segundo de gracia: preguntar en el instante exacto suele llegar antes
    // de que el backend haya marcado el vencimiento.
    const faltan = Math.max(vencimiento - Date.now(), 0) + 1000
    const alVencer = setTimeout(() => void verificar(), faltan)

    return () => clearTimeout(alVencer)
  }, [codigoReferencia, activa, expiraEn, verificar])

  // 4: a pedido, antes de confirmar la venta.
  return { verificarAhora: verificar }
}
