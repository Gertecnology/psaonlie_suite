import { getAuthHeaders } from './auth-headers'

const API_URL = import.meta.env.VITE_API_URL

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

/**
 * Lee el cuerpo de la respuesta y lo interpreta como envelope.
 *
 * Devuelve `null` cuando el cuerpo está vacío (204) o cuando no es JSON
 * (por ejemplo, un 502 con HTML de un proxy). Nunca lanza: quien llama decide
 * qué hacer según el status.
 */
async function parseEnvelope<T>(
  response: Response,
): Promise<ApiEnvelope<T> | null> {
  let text: string
  try {
    text = await response.text()
  } catch {
    return null
  }

  if (!text) return null

  try {
    return JSON.parse(text) as ApiEnvelope<T>
  } catch {
    return null
  }
}

interface ApiFetchOptions extends RequestInit {
  /** Mensaje a mostrar cuando el backend no devuelve uno propio. */
  fallbackMessage?: string
}

/**
 * Cliente HTTP compartido para el backend.
 *
 * Por qué existe: históricamente el backend respondía HTTP 200/201 incluso
 * cuando la operación fallaba, con `success: false` dentro del cuerpo. Los
 * services que decidían sólo con `response.ok` daban por exitoso cualquier
 * fallo (toast verde, lista sin cambios).
 *
 * El backend corregido devuelve el status real (400/401/404/409/500), pero la
 * versión vieja sigue desplegada en producción. Por eso acá se valida SIEMPRE
 * las dos: `response.ok` **y** `body.success`. Así el manejo de errores es
 * correcto contra ambas versiones.
 *
 * Adjunta el token de acceso automáticamente y devuelve `data` ya desenvuelto.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const {
    fallbackMessage = 'Error al comunicarse con el servidor.',
    headers: extraHeaders,
    ...init
  } = options

  // Con FormData el navegador debe fijar el Content-Type (incluye el boundary).
  const isFormData = init.body instanceof FormData

  const headers = getAuthHeaders({
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((extraHeaders as Record<string, string> | undefined) ?? {}),
  })

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    // Fallo de red / CORS: nunca llegamos al backend.
    throw new ApiError(
      'No se pudo conectar con el servidor. Verificá tu conexión.',
      0,
    )
  }

  const body = await parseEnvelope<T>(response)

  // Doble verificación: status HTTP (backend nuevo) y flag del envelope (viejo).
  if (!response.ok || body?.success === false) {
    throw new ApiError(
      body?.message || fallbackMessage,
      body?.statusCode ?? response.status,
      body?.error?.code,
      body?.error?.details,
    )
  }

  // 204 o cuerpo vacío: la operación fue exitosa y no hay payload.
  if (body === null) {
    return undefined as T
  }

  return body.data as T
}
