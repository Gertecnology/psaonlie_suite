import { useCallback, useEffect } from 'react'
import { type RefreshTokenResponse } from '@/services/auth'
import {
  renovarSesion,
  renovarSesionSiHaceFalta,
  sesionAgotada,
} from '@/services/sesion'

interface OpcionesRefresco {
  /** How often to check whether the token needs renewing. */
  intervaloMs?: number
  onRefreshSuccess?: (datos: RefreshTokenResponse) => void
  onRefreshError?: (error: Error) => void
}

/**
 * Keeps the session alive while the app is open.
 *
 * Two things changed here. It used to renew on a fixed 14-minute timer,
 * unconditionally — which renews a token that may have 50 minutes left, and
 * misses one issued with a shorter life. Now it checks every minute and only
 * renews when the token is close to expiring, so the schedule follows the
 * token instead of a number someone picked once.
 *
 * And the renewal itself moved to `services/sesion`, because it was not the
 * only caller: the notifications context ran its own two-minute timer and the
 * socket renewed on a rejected handshake, each with a private "already
 * refreshing" flag. Since `/refresh-token` rotates the refresh token, two
 * concurrent renewals leave the spent one in storage and the session dies on
 * the next attempt. One in-flight promise, shared, closes that.
 */
export const useTokenRefresh = (opciones: OpcionesRefresco = {}) => {
  const { intervaloMs = 60_000, onRefreshSuccess, onRefreshError } = opciones

  useEffect(() => {
    const revisar = async () => {
      if (sesionAgotada()) return
      if (!localStorage.getItem('refreshToken')) return

      const renovada = await renovarSesionSiHaceFalta(onRefreshSuccess)
      if (!renovada) {
        onRefreshError?.(new Error('No se pudo renovar la sesión'))
      }
    }

    const intervalo = setInterval(() => void revisar(), intervaloMs)
    return () => clearInterval(intervalo)
  }, [intervaloMs, onRefreshSuccess, onRefreshError])

  const manualRefresh = useCallback(
    () => renovarSesion(onRefreshSuccess),
    [onRefreshSuccess]
  )

  return { manualRefresh }
}
