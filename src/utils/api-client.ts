import { getAuthHeaders } from './auth-headers'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Timeout por defecto de cualquier request.
 *
 * El backend proxea llamadas SOAP a las empresas de transporte, que son lentas
 * y a veces no responden nunca. Sin timeout la UI se queda con el spinner
 * girando para siempre y el operador no sabe si la operación salió o no.
 */
export const TIMEOUT_POR_DEFECTO_MS = 60_000

/**
 * Envelope estándar que devuelven todos los endpoints del backend.
 * `data` viene sólo en las respuestas exitosas; `error` sólo en las fallidas.
 */
export interface ApiEnvelope<T> {
  success: boolean
  statusCode: number
  message: string
  data?: T
  error?: {
    code: string
    details?: unknown
  }
}

/**
 * Error de API con el detalle del envelope ya extraído.
 * `message` es siempre el texto que se le muestra al usuario.
 */
export class ApiError extends Error {
  readonly statusCode: number
  readonly code?: string
  readonly details?: unknown

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

/** `statusCode` que usamos cuando nunca llegamos a hablar con el backend. */
export const STATUS_SIN_RESPUESTA = 0

/** `code` del ApiError cuando la request se cortó por timeout. */
export const CODIGO_TIMEOUT = 'TIMEOUT'

/**
 * Lee el cuerpo de la respuesta y lo interpreta como JSON.
 *
 * Devuelve `null` cuando el cuerpo está vacío (204) o cuando no es JSON
 * (por ejemplo, un 502 con HTML de un proxy). Nunca lanza: quien llama decide
 * qué hacer según el status.
 */
async function parseBody<T>(response: Response): Promise<T | null> {
  let text: string
  try {
    text = await response.text()
  } catch {
    return null
  }

  if (!text) return null

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export interface ApiFetchOptions extends RequestInit {
  /** Mensaje a mostrar cuando el backend no devuelve uno propio. */
  fallbackMessage?: string
  /** Corta la request pasado este tiempo. Ver TIMEOUT_POR_DEFECTO_MS. */
  timeoutMs?: number
}

/**
 * Ejecuta la request, valida el resultado y devuelve el cuerpo ya parseado.
 *
 * Por qué la validación es doble: históricamente el backend respondía
 * HTTP 200/201 incluso cuando la operación fallaba, con `success: false` dentro
 * del cuerpo. Los services que decidían sólo con `response.ok` daban por
 * exitoso cualquier fallo (toast verde, datos sin cambios).
 *
 * El backend corregido devuelve el status real (400/401/404/409/500), pero la
 * versión vieja sigue desplegada en producción. Por eso se valida SIEMPRE las
 * dos: `response.ok` **y** `body.success`. Así el manejo de errores es correcto
 * contra ambas versiones.
 */
async function ejecutarRequest(
  path: string,
  options: ApiFetchOptions,
): Promise<unknown> {
  const {
    fallbackMessage = 'Error al comunicarse con el servidor.',
    timeoutMs = TIMEOUT_POR_DEFECTO_MS,
    headers: extraHeaders,
    signal: signalExterna,
    ...init
  } = options

  // Con FormData el navegador debe fijar el Content-Type (incluye el boundary).
  const isFormData = init.body instanceof FormData

  const headers = getAuthHeaders({
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((extraHeaders as Record<string, string> | undefined) ?? {}),
  })

  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs)
  const cancelarPorSignalExterna = () => controlador.abort()
  signalExterna?.addEventListener('abort', cancelarPorSignalExterna)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      signal: controlador.signal,
    })
  } catch {
    // Distinguimos el corte por timeout del fallo de red: al operador le
    // cambia lo que tiene que hacer (esperar y reintentar vs revisar conexión).
    if (controlador.signal.aborted && !signalExterna?.aborted) {
      throw new ApiError(
        'El servidor tardó demasiado en responder. La operación puede haber quedado a medias: verificá antes de reintentar.',
        STATUS_SIN_RESPUESTA,
        CODIGO_TIMEOUT,
      )
    }
    throw new ApiError(
      'No se pudo conectar con el servidor. Verificá tu conexión.',
      STATUS_SIN_RESPUESTA,
    )
  } finally {
    clearTimeout(temporizador)
    signalExterna?.removeEventListener('abort', cancelarPorSignalExterna)
  }

  const body = await parseBody<ApiEnvelope<unknown>>(response)

  // Doble verificación: status HTTP (backend nuevo) y flag del envelope (viejo).
  if (!response.ok || body?.success === false) {
    throw new ApiError(
      body?.message || fallbackMessage,
      body?.statusCode ?? response.status,
      body?.error?.code,
      body?.error?.details,
    )
  }

  return body
}

/**
 * Cliente HTTP para los endpoints que responden con el envelope estándar
 * (`{ success, statusCode, message, data }`): empresas, destinos, agencias y
 * service charges. Devuelve `data` ya desenvuelto.
 *
 * Adjunta el token de acceso automáticamente.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const body = (await ejecutarRequest(path, options)) as ApiEnvelope<T> | null

  // 204 o cuerpo vacío: la operación fue exitosa y no hay payload.
  if (body === null) {
    return undefined as T
  }

  return body.data as T
}

/**
 * Cliente HTTP para los endpoints que devuelven el objeto directamente, sin
 * envelope: todo `/api/ventas/*`, `/api/clientes/*`, `/api/paises`,
 * `/api/servicios-por-destinos` y `/api/search-paradas-homologadas`.
 *
 * Hace exactamente las mismas verificaciones que `apiFetch` (token, status HTTP
 * y `success: false` si viniera), pero devuelve el cuerpo tal cual porque en
 * estos endpoints no hay campo `data` que desenvolver.
 */
export async function apiFetchRaw<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const body = (await ejecutarRequest(path, options)) as T | null

  if (body === null) {
    return undefined as T
  }

  return body
}
