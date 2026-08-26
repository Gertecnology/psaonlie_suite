import { refreshToken as pedirTokenNuevo, type RefreshTokenResponse } from './auth'

/**
 * The one place that renews the session.
 *
 * ## Why it has to be one place
 *
 * There were two timers doing this — `use-token-refresh` every 14 minutes from
 * the auth context, and `use-token-monitor` every 2 minutes from the
 * notifications context — plus the socket service on a rejected handshake.
 * Each had its own "already refreshing" guard, and a guard only serializes the
 * callers that can see it.
 *
 * That matters because `/refresh-token` **rotates** the refresh token: the
 * response carries a new one and the old one is spent. Two concurrent requests
 * therefore produce two new tokens, and whichever response lands second
 * overwrites storage with a token the backend already replaced. The next
 * renewal fails and the session drops — for no reason the user can see.
 *
 * So renewal lives here, behind a single in-flight promise, and everyone else
 * calls in.
 */

/** Renew once the token has under this long to live. */
export const MARGEN_DE_RENOVACION_MS = 5 * 60 * 1000

let enCurso: Promise<boolean> | null = null

/**
 * Set when renewal failed because the refresh token is spent too.
 *
 * Retrying then only hammers a backend that will keep saying no. Cleared by
 * `reiniciarSesion()`, which is what a fresh login does.
 */
let agotada = false

export function sesionAgotada(): boolean {
  return agotada
}

/** Called after a login: whatever failed before no longer applies. */
export function reiniciarSesion(): void {
  agotada = false
  enCurso = null
}

/** `exp` is seconds since the epoch; `margen` is milliseconds from now. */
export function tokenVenceAntesDe(margen: number = MARGEN_DE_RENOVACION_MS): boolean {
  const token = localStorage.getItem('accessToken')
  if (!token) return true

  try {
    const carga = JSON.parse(atob(token.split('.')[1])) as { exp?: number }
    if (!carga.exp) return true
    return carga.exp * 1000 - Date.now() < margen
  } catch {
    // Unreadable is as good as expired: let the renewal decide.
    return true
  }
}

/**
 * Renew now. Concurrent callers share the single in-flight request.
 *
 * `alRenovar` receives the response so the auth context can update its state;
 * it runs for every caller of the shared promise, not just the first.
 */
export function renovarSesion(
  alRenovar?: (datos: RefreshTokenResponse) => void
): Promise<boolean> {
  if (enCurso) {
    return alRenovar ? enCurso.then((ok) => ok) : enCurso
  }

  enCurso = (async () => {
    const guardado = localStorage.getItem('refreshToken')
    if (!guardado) {
      agotada = true
      return false
    }

    try {
      const datos = await pedirTokenNuevo(guardado)
      localStorage.setItem('accessToken', datos.accessToken)
      localStorage.setItem('refreshToken', datos.refreshToken)
      localStorage.setItem('user', JSON.stringify(datos.user))
      agotada = false
      ultimaRespuesta = datos
      return true
    } catch {
      agotada = true
      ultimaRespuesta = null
      return false
    } finally {
      enCurso = null
    }
  })()

  const promesa = enCurso
  if (alRenovar) {
    void promesa.then((ok) => {
      if (ok && ultimaRespuesta) alRenovar(ultimaRespuesta)
    })
  }
  return promesa
}

/** The response of the last successful renewal, for callers that need it. */
let ultimaRespuesta: RefreshTokenResponse | null = null

/** Renew only if the token is close to expiring. */
export function renovarSesionSiHaceFalta(
  alRenovar?: (datos: RefreshTokenResponse) => void
): Promise<boolean> {
  if (agotada) return Promise.resolve(false)
  if (!tokenVenceAntesDe()) return Promise.resolve(true)
  return renovarSesion(alRenovar)
}
