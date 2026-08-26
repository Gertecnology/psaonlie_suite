import { beforeEach, describe, expect, it, vi } from 'vitest'

const pedirTokenNuevo = vi.fn()
vi.mock('./auth', () => ({
  refreshToken: (token: string) => pedirTokenNuevo(token),
}))

/** A JWT whose `exp` is `segundos` from now. Only the payload is read. */
function tokenQueVence(segundos: number): string {
  const carga = { exp: Math.floor(Date.now() / 1000) + segundos, sub: 'u1' }
  return `x.${btoa(JSON.stringify(carga))}.y`
}

/** Fresh module instance: the in-flight promise is module state. */
async function cargar() {
  vi.resetModules()
  return import('./sesion')
}

beforeEach(() => {
  pedirTokenNuevo.mockReset()
  localStorage.clear()
})

describe('renovación de sesión', () => {
  it('hace una sola petición aunque se lo pidan a la vez desde varios lados', async () => {
    localStorage.setItem('refreshToken', 'vigente')
    let resolver: (datos: unknown) => void = () => {}
    pedirTokenNuevo.mockImplementation(
      () => new Promise((r) => { resolver = r })
    )

    const sesion = await cargar()
    const pedidos = [
      sesion.renovarSesion(),
      sesion.renovarSesion(),
      sesion.renovarSesion(),
    ]

    resolver({
      accessToken: tokenQueVence(3600),
      refreshToken: 'rotado',
      user: { id: 'u1' },
    })
    const resultados = await Promise.all(pedidos)

    // `/refresh-token` rota el refresh token: dos peticiones en paralelo
    // producen dos tokens nuevos y la respuesta que llega segunda deja
    // guardado uno que el backend ya reemplazó. La sesión se cae en la
    // renovación siguiente, sin causa visible.
    expect(pedirTokenNuevo).toHaveBeenCalledTimes(1)
    expect(resultados).toEqual([true, true, true])
    expect(localStorage.getItem('refreshToken')).toBe('rotado')
  })

  it('deja de intentar cuando el refresh token también está vencido', async () => {
    localStorage.setItem('refreshToken', 'vencido')
    pedirTokenNuevo.mockRejectedValue(new Error('401'))

    const sesion = await cargar()
    expect(await sesion.renovarSesion()).toBe(false)
    expect(sesion.sesionAgotada()).toBe(true)

    // Insistir contra un backend que ya dijo que no es exactamente lo que
    // llenaba el log de errores.
    expect(await sesion.renovarSesionSiHaceFalta()).toBe(false)
    expect(pedirTokenNuevo).toHaveBeenCalledTimes(1)
  })

  it('un login nuevo vuelve a habilitar la renovación', async () => {
    localStorage.setItem('refreshToken', 'vencido')
    pedirTokenNuevo.mockRejectedValue(new Error('401'))

    const sesion = await cargar()
    await sesion.renovarSesion()
    expect(sesion.sesionAgotada()).toBe(true)

    sesion.reiniciarSesion()
    expect(sesion.sesionAgotada()).toBe(false)
  })

  it('no renueva un token al que todavía le sobra vida', async () => {
    localStorage.setItem('accessToken', tokenQueVence(3600))
    localStorage.setItem('refreshToken', 'vigente')

    const sesion = await cargar()
    expect(await sesion.renovarSesionSiHaceFalta()).toBe(true)
    expect(pedirTokenNuevo).not.toHaveBeenCalled()
  })

  it('renueva cuando quedan menos de cinco minutos', async () => {
    localStorage.setItem('accessToken', tokenQueVence(60))
    localStorage.setItem('refreshToken', 'vigente')
    pedirTokenNuevo.mockResolvedValue({
      accessToken: tokenQueVence(3600),
      refreshToken: 'rotado',
      user: { id: 'u1' },
    })

    const sesion = await cargar()
    expect(await sesion.renovarSesionSiHaceFalta()).toBe(true)
    expect(pedirTokenNuevo).toHaveBeenCalledTimes(1)
  })

  it('avisa al que quiere enterarse, con los datos de la respuesta', async () => {
    localStorage.setItem('refreshToken', 'vigente')
    const respuesta = {
      accessToken: tokenQueVence(3600),
      refreshToken: 'rotado',
      user: { id: 'u1', email: 'a@b.c' },
    }
    pedirTokenNuevo.mockResolvedValue(respuesta)

    const sesion = await cargar()
    const avisado = vi.fn()
    await sesion.renovarSesion(avisado)
    await Promise.resolve()

    // El contexto de autenticación necesita el usuario y el token nuevos para
    // actualizar su estado; sin esto la sesión se renueva sólo en storage.
    expect(avisado).toHaveBeenCalledWith(respuesta)
  })
})
