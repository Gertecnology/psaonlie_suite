import { vi } from 'vitest'

export interface RutaMock {
  /** Fragmento que tiene que aparecer en la URL. */
  url: string
  status?: number
  body: unknown
  /** Si se define, cada llamada consume la siguiente respuesta de la lista. */
  respuestas?: Array<{ status?: number; body: unknown }>
}

export interface ApiMock {
  fetchMock: ReturnType<typeof vi.fn>
  /** Llamadas crudas, ya tipadas como [url, init]. */
  llamadas: () => Array<[RequestInfo | URL, RequestInit?]>
  /** Cantidad de llamadas cuya URL contiene el fragmento. */
  llamadasA: (fragmento: string) => number
  /** Cuerpos enviados a las llamadas cuya URL contiene el fragmento. */
  cuerposDe: (fragmento: string) => unknown[]
}

/**
 * Instala un `fetch` falso que responde según la URL.
 *
 * Los tests de flujo van contra los services de verdad: lo único simulado es
 * la red. Así se ejerce el mismo camino que en producción, incluida la
 * verificación del resultado del bloqueo.
 */
export function mockearApi(rutas: RutaMock[]): ApiMock {
  const contadores = new Map<string, number>()

  const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
    const url = String(input)
    const ruta = rutas.find((candidata) => url.includes(candidata.url))

    if (!ruta) {
      throw new Error(`Ruta no mockeada en el test: ${url}`)
    }

    const usadas = contadores.get(ruta.url) ?? 0
    contadores.set(ruta.url, usadas + 1)

    const respuesta = ruta.respuestas
      ? (ruta.respuestas[Math.min(usadas, ruta.respuestas.length - 1)] ?? {
          status: ruta.status,
          body: ruta.body,
        })
      : { status: ruta.status, body: ruta.body }

    const status = respuesta.status ?? 200

    return {
      ok: status < 400,
      status,
      text: async () => JSON.stringify(respuesta.body),
    } as unknown as Response
  })

  vi.stubGlobal('fetch', fetchMock)

  const llamadas = () =>
    fetchMock.mock.calls as unknown as Array<[RequestInfo | URL, RequestInit?]>

  const llamadasConUrl = (fragmento: string) =>
    llamadas().filter(([url]) => String(url).includes(fragmento))

  return {
    fetchMock,
    llamadas,
    llamadasA: (fragmento) => llamadasConUrl(fragmento).length,
    cuerposDe: (fragmento) =>
      llamadasConUrl(fragmento).map(([, init]) =>
        typeof init?.body === 'string' ? JSON.parse(init.body) : undefined,
      ),
  }
}
