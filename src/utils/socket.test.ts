import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * These tests exist because of a specific outage in the dev log: the backend
 * filled with `jwt expired` from sockets nobody could reach any more. Each case
 * below pins one of the three causes so it cannot come back silently.
 */

const socketsCreados: FalsoSocket[] = []

/** The bits of a socket.io client the service actually touches. */
class FalsoSocket {
  connected = false
  cerrado = false
  conexiones = 0
  readonly manejadores = new Map<string, Array<(...args: unknown[]) => void>>()

  constructor(readonly opciones: Record<string, unknown>) {}

  on(evento: string, callback: (...args: unknown[]) => void) {
    const lista = this.manejadores.get(evento) ?? []
    lista.push(callback)
    this.manejadores.set(evento, lista)
    return this
  }

  off(evento: string, callback?: (...args: unknown[]) => void) {
    if (!callback) {
      this.manejadores.delete(evento)
      return this
    }
    const lista = (this.manejadores.get(evento) ?? []).filter(
      (registrada) => registrada !== callback
    )
    this.manejadores.set(evento, lista)
    return this
  }

  emit() {
    return this
  }

  connect() {
    this.conexiones += 1
    return this
  }

  close() {
    this.cerrado = true
    this.connected = false
    return this
  }

  disconnect() {
    this.connected = false
    return this
  }

  /** Fire an event the way socket.io would. */
  disparar(evento: string, ...args: unknown[]) {
    for (const callback of this.manejadores.get(evento) ?? []) callback(...args)
  }

  /** Ask the service for the token, as socket.io does on every attempt. */
  tokenDelHandshake(): string {
    const auth = this.opciones.auth as (
      cb: (datos: { token: string }) => void
    ) => void
    let token = ''
    auth((datos) => {
      token = datos.token
    })
    return token
  }
}

vi.mock('socket.io-client', () => ({
  io: (_url: string, opciones: Record<string, unknown>) => {
    const socket = new FalsoSocket(opciones)
    socketsCreados.push(socket)
    return socket
  },
}))

const pedirTokenNuevo = vi.fn()
vi.mock('@/services/auth', () => ({
  refreshToken: (token: string) => pedirTokenNuevo(token),
}))

/** A JWT whose `exp` is `segundos` from now. Only the payload is read. */
function tokenQueVence(segundos: number): string {
  const carga = { exp: Math.floor(Date.now() / 1000) + segundos, sub: 'u1' }
  return `x.${btoa(JSON.stringify(carga))}.y`
}

/** Fresh module instance: the service is a singleton created on import. */
async function cargarServicio() {
  vi.resetModules()
  const modulo = await import('./socket')
  return modulo.socketService
}

beforeEach(() => {
  socketsCreados.length = 0
  pedirTokenNuevo.mockReset()
  localStorage.clear()
})

describe('SocketService', () => {
  it('abre un solo socket aunque se lo pida varias veces', async () => {
    localStorage.setItem('accessToken', tokenQueVence(3600))
    const servicio = await cargarServicio()

    await servicio.connect()
    await servicio.connect()
    await servicio.ensureConnection()

    // El defecto original creaba uno por llamada, con `forceNew: true`, y
    // dejaba vivos a los anteriores.
    expect(socketsCreados).toHaveLength(1)
  })

  it('entrega el token vigente en cada handshake, no el del momento de crearse', async () => {
    localStorage.setItem('accessToken', tokenQueVence(3600))
    const servicio = await cargarServicio()
    await servicio.connect()

    const socket = socketsCreados[0]
    expect(socket.tokenDelHandshake()).toBe(localStorage.getItem('accessToken'))

    // Un refresco posterior cambia el token guardado. Con `auth` como objeto,
    // el socket seguiría mandando el viejo para siempre: eso es lo que llenaba
    // el log del backend de `jwt expired`.
    const renovado = tokenQueVence(7200)
    localStorage.setItem('accessToken', renovado)
    expect(socket.tokenDelHandshake()).toBe(renovado)
  })

  it('al desconectar cierra el socket, que además apaga su reintento', async () => {
    localStorage.setItem('accessToken', tokenQueVence(3600))
    const servicio = await cargarServicio()
    await servicio.connect()

    servicio.disconnect()

    // `disconnect()` a secas dejaba la instancia reintentando de fondo.
    expect(socketsCreados[0].cerrado).toBe(true)
    expect(servicio.getSocket()).toBeNull()
  })

  it('deja de reintentar cuando el refresh token también venció', async () => {
    localStorage.setItem('accessToken', tokenQueVence(3600))
    localStorage.setItem('refreshToken', 'vencido')
    pedirTokenNuevo.mockRejectedValue(new Error('401'))

    const servicio = await cargarServicio()
    await servicio.connect()
    const socket = socketsCreados[0]

    // El gateway rechaza y corta, como hace ante un token que no verifica.
    socket.disparar('disconnect', 'io server disconnect')
    await vi.waitFor(() => expect(pedirTokenNuevo).toHaveBeenCalledTimes(1))

    socket.disparar('disconnect', 'io server disconnect')
    socket.disparar('connect_error', new Error('jwt expired'))
    await Promise.resolve()

    // Insistir contra un backend que ya dijo que no es exactamente la tormenta
    // que se quiere evitar.
    expect(pedirTokenNuevo).toHaveBeenCalledTimes(1)
    expect(await servicio.ensureConnection()).toBe(false)
  })

  it('comparte un solo refresco entre los que lo piden a la vez', async () => {
    localStorage.setItem('accessToken', tokenQueVence(60))
    localStorage.setItem('refreshToken', 'vigente')
    pedirTokenNuevo.mockResolvedValue({
      accessToken: tokenQueVence(3600),
      refreshToken: 'nuevo',
      user: { id: 'u1' },
    })

    const servicio = await cargarServicio()
    await Promise.all([
      servicio.refreshToken(),
      servicio.refreshToken(),
      servicio.refreshToken(),
    ])

    expect(pedirTokenNuevo).toHaveBeenCalledTimes(1)
  })

  it('no pide un token nuevo si al actual todavía le queda vida', async () => {
    localStorage.setItem('accessToken', tokenQueVence(3600))
    localStorage.setItem('refreshToken', 'vigente')

    const servicio = await cargarServicio()
    expect(await servicio.refreshTokenIfNeeded()).toBe(true)

    // El monitor corre cada dos minutos: si no mirara el vencimiento, le
    // pediría un token nuevo al backend en cada vuelta.
    expect(pedirTokenNuevo).not.toHaveBeenCalled()
  })
})
