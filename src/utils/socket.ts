import { io, Socket } from 'socket.io-client'
import {
  renovarSesion,
  renovarSesionSiHaceFalta,
  sesionAgotada,
  reiniciarSesion,
} from '@/services/sesion'

/**
 * The single notifications socket.
 *
 * ## Why this was rewritten
 *
 * The previous version opened a new socket on every failure and never closed
 * the old one, so the backend log filled with `jwt expired` from connections
 * nobody could reach any more. Three things caused it, and each is answered
 * below by a specific choice:
 *
 * 1. **The token was frozen at birth.** `auth: { token }` is read once, when
 *    the socket is created. socket.io then reconnects forever on its own,
 *    replaying that same string long after it expired. Passing `auth` as a
 *    *function* makes socket.io ask for the token on every attempt, so a
 *    reconnection always carries the current one.
 *
 * 2. **Every failure spawned a new socket.** `forceNew: true` plus a hand
 *    written retry loop meant `this.socket` was overwritten while the previous
 *    instance stayed alive and kept retrying, unreachable. There is now exactly
 *    one socket for the lifetime of the session, and socket.io's own backoff
 *    does the retrying.
 *
 * 3. **One failure triggered three retries.** `on('error')`, `onAny()` (which
 *    matched any event whose name contained "error") and
 *    `on('disconnect') -> handleReconnect()` each started an independent
 *    refresh-and-reconnect chain. Only one path handles auth failure now, and
 *    concurrent callers share a single in-flight refresh.
 */

/**
 * The socket follows the API URL — same backend, `/notifications` namespace.
 * `VITE_SOCKET_URL` overrides it.
 */
function resolverUrl(): string {
  const explicita = import.meta.env.VITE_SOCKET_URL
  if (explicita) return explicita
  const api = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  return `${api.replace(/^http/, 'ws').replace(/\/+$/, '')}/notifications`
}

const URL_SOCKET = resolverUrl()


type Escucha = (...args: unknown[]) => void

class SocketService {
  private socket: Socket | null = null

  /** Registered by the app, re-applied whenever the socket is (re)built. */
  private escuchas = new Map<string, Set<Escucha>>()

  // ── conexión ───────────────────────────────────────────────────────────

  async connect(accessToken?: string): Promise<Socket> {
    if (accessToken) {
      // An explicit token means a new session: whatever failed before no
      // longer applies.
      reiniciarSesion()
    }

    await renovarSesionSiHaceFalta()

    if (this.socket) {
      // One socket per session. If the server dropped it, reopen that same
      // one instead of building another.
      if (!this.socket.connected) this.socket.connect()
      return this.socket
    }

    this.socket = io(URL_SOCKET, {
      // A function, not an object: socket.io calls it on every attempt, so a
      // reconnection two hours from now carries the token of two hours from
      // now. This is the fix for the `jwt expired` flood.
      auth: (cb) => cb({ token: localStorage.getItem('accessToken') ?? '' }),
      transports: ['websocket'],
      timeout: 20_000,
      // socket.io's backoff, with a ceiling. The hand-written retry loop this
      // replaces had none, and raced against this one.
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
    })

    this.socket.on('disconnect', (motivo) => {
      // `io server disconnect` is the gateway hanging up on us, which is what
      // it does when the token does not verify. socket.io deliberately does
      // NOT retry that case — the server said no — so this is the one place
      // that has to act, and it acts once.
      if (motivo === 'io server disconnect') void this.reintentarTrasRechazo()
    })

    this.socket.on('connect_error', (error) => {
      if (esFalloDeAutenticacion(error)) void this.reintentarTrasRechazo()
    })

    this.aplicarEscuchas()

    return this.socket
  }

  /**
   * The gateway rejected us. Refresh the token and try that same socket again.
   *
   * There is no loop here: `renovar()` is deduplicated and, once it fails,
   * `autenticacionAgotada` stops any further attempt.
   */
  private async reintentarTrasRechazo(): Promise<void> {
    if (sesionAgotada() || !this.socket) return

    const renovado = await renovarSesion()
    if (!renovado) {
      this.socket?.close()
      return
    }
    // `auth` is re-read on connect, so this carries the new token.
    this.socket?.connect()
  }

  disconnect() {
    // `close()` and not `disconnect()`: it also stops socket.io's reconnection
    // engine. `disconnect()` alone left the instance retrying in the
    // background, which is how the orphans accumulated.
    this.socket?.close()
    this.socket = null
  }

  async ensureConnection(): Promise<boolean> {
    if (this.socket?.connected) return true
    if (sesionAgotada()) return false
    if (!localStorage.getItem('accessToken')) return false

    try {
      await this.connect()
      return true
    } catch {
      return false
    }
  }

  /** Rebuild from scratch. For the "reconnect" button, not for error handling. */
  async forceReconnect(): Promise<boolean> {
    this.disconnect()
    reiniciarSesion()
    return this.ensureConnection()
  }

  // ── token ──────────────────────────────────────────────────────────────

  /**
   * Renew the access token. Public because a UI action may ask for it.
   *
   * It does not touch the socket: a live connection was authenticated at its
   * handshake and stays valid: tearing it down to "apply" a new token is what
   * the old `refreshTokenAndReconnect` did, and it dropped a working
   * connection every two minutes.
   */
  async refreshToken(): Promise<boolean> {
    return renovarSesion()
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
    return renovarSesionSiHaceFalta()
  }

  // ── escuchas ───────────────────────────────────────────────────────────

  addListener(evento: string, callback: Escucha) {
    // A Set, not one callback per event: the previous Map kept only the last
    // registration, so a second subscriber silently replaced the first.
    const registradas = this.escuchas.get(evento) ?? new Set<Escucha>()
    registradas.add(callback)
    this.escuchas.set(evento, registradas)
    this.socket?.on(evento, callback)
  }

  removeListener(evento: string, callback?: Escucha) {
    if (callback) {
      this.escuchas.get(evento)?.delete(callback)
      this.socket?.off(evento, callback)
      return
    }
    this.escuchas.delete(evento)
    this.socket?.off(evento)
  }

  off(evento: string, callback?: Escucha) {
    this.removeListener(evento, callback)
  }

  onNewNotification(callback: (dato: unknown) => void) {
    this.addListener('new-notification', callback as Escucha)
  }

  private aplicarEscuchas() {
    if (!this.socket) return
    for (const [evento, registradas] of this.escuchas) {
      for (const callback of registradas) this.socket.on(evento, callback)
    }
  }

  // ── estado ─────────────────────────────────────────────────────────────

  emit(evento: string, dato?: unknown) {
    if (this.socket?.connected) this.socket.emit(evento, dato)
  }

  getSocket(): Socket | null {
    return this.socket
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  isConnectionHealthy(): boolean {
    return this.isConnected()
  }
}

/**
 * socket.io reports a rejected handshake as a plain `Error`, so the reason
 * only exists as text. `data` carries whatever the server attached.
 */
function esFalloDeAutenticacion(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const mensaje = 'message' in error ? String(error.message) : ''
  const datos = 'data' in error ? JSON.stringify(error.data) : ''
  return /jwt|token|auth|unauthorized/i.test(`${mensaje} ${datos}`)
}

export const socketService = new SocketService()
