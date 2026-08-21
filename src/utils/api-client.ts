import { getAuthHeaders } from './auth-headers'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Envelope del backend.
 *
 * Ojo: NO todos los endpoints lo usan en las respuestas exitosas.
 *
 * - `empresas`, `agencias`, `destinos`, `service-charges` construyen el envelope
 *   a mano con `ApiResponseMapper.success(...)` → `{ success, statusCode, message, data }`.
 * - `api/admin/ventas/*`, `api/pagos/*`, `api/boletos/*` y `api/admin/jobs/*`
 *   devuelven el objeto **pelado**, sin envelope.
 * - En cambio, **todos** los errores pasan por `AllExceptionsFilter` y sí vienen
 *   enveloped, con el status HTTP real.
 *
 * Verificado el 21/08/2026 contra el worktree `wt/informes` (`main.ts` no
 * registra ningún interceptor de transformación de respuesta).
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
    details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

/** Cuerpo JSON ya parseado, todavía sin interpretar. */
type CuerpoJson = Record<string, unknown>

/**
 * Lee el cuerpo de la respuesta como JSON.
 *
 * Devuelve `null` cuando el cuerpo está vacío (204) o cuando no es JSON
 * (por ejemplo, un 502 con HTML de un proxy). Nunca lanza: quien llama decide
 * qué hacer según el status.
 */
async function parsearJson(response: Response): Promise<unknown> {
  let text: string
  try {
    text = await response.text()
  } catch {
    return null
  }

  if (!text) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/**
 * Distingue un envelope de una respuesta pelada.
 *
 * El criterio son las **dos** marcas juntas: `success` booleano y `statusCode`
 * numérico. Pedir sólo `success` daría un falso positivo con
 * `POST /api/admin/jobs/ejecutar/:job`, que responde `{ success, resultado,
 * mensaje }` — ahí el objeto entero es el payload, no un sobre.
 *
 * Ningún DTO de negocio del backend tiene esas dos propiedades a la vez.
 */
export function esEnvelope(cuerpo: unknown): cuerpo is ApiEnvelope<unknown> {
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return false
  }
  const c = cuerpo as CuerpoJson
  return typeof c.success === 'boolean' && typeof c.statusCode === 'number'
}

/**
 * `true` si el cuerpo declara que la operación falló.
 *
 * Es una pregunta distinta de `esEnvelope`, que sólo decide **dónde está el
 * payload**. `POST /api/admin/jobs/ejecutar/:job` responde HTTP 200 con
 * `{ success: false, resultado: null, mensaje }` — no es un sobre, pero sí es
 * un fracaso, y tratarlo como éxito mostraría un toast verde sobre un job que
 * no corrió.
 */
function indicaFallo(cuerpo: unknown): boolean {
  if (cuerpo === null || typeof cuerpo !== 'object') return false
  return (cuerpo as CuerpoJson).success === false
}

/**
 * Extrae el mensaje de error que devolvió el backend.
 *
 * Contempla las tres formas que conviven hoy:
 * - `message` — envelope de `AllExceptionsFilter`.
 * - `mensaje` — `JobsController`, que además responde HTTP 200 al fallar.
 * - `error` — el `debug/:numeroTransaccion`, que devuelve `{ error: '...' }` con 200.
 */
function extraerMensaje(cuerpo: unknown): string | undefined {
  if (cuerpo === null || typeof cuerpo !== 'object') return undefined
  const c = cuerpo as CuerpoJson

  for (const clave of ['message', 'mensaje'] as const) {
    const valor = c[clave]
    if (typeof valor === 'string' && valor.length > 0) return valor
  }

  // `error` puede ser un string (mensaje) o el objeto `{ code, details }`.
  if (typeof c.error === 'string' && c.error.length > 0) return c.error

  return undefined
}

interface ApiFetchOptions extends RequestInit {
  /** Mensaje a mostrar cuando el backend no devuelve uno propio. */
  fallbackMessage?: string
}

/**
 * Cliente HTTP compartido para el backend.
 *
 * Resuelve tres cosas que antes cada service repetía (mal):
 *
 * 1. **Adjunta el token.** Los services de dashboard y reportes ni siquiera
 *    mandaban `Authorization`; desde que los endpoints admin exigen JWT, eso es
 *    un 401 garantizado.
 * 2. **Decide bien si falló.** El backend viejo respondía 200 con
 *    `success: false` adentro; el nuevo devuelve el status real. Acá se validan
 *    las dos cosas, así el manejo de errores es correcto contra ambas versiones.
 * 3. **Desenvuelve sólo cuando hay sobre.** Ver `esEnvelope`: los endpoints de
 *    `/api/admin/ventas/*` devuelven el objeto pelado y hacer `body.data` los
 *    convertía en `undefined`.
 *
 * PENDIENTE DE AJUSTE: si el backend unifica el envelope en `AdminVentaController`
 * (hoy sólo migró `empresa.controller.ts`, commit `305172e1`), esta función sigue
 * funcionando sin cambios — `esEnvelope` empieza a dar `true` y desenvuelve.
 * No hay nada que tocar del lado del panel.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
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
      0
    )
  }

  const cuerpo = await parsearJson(response)
  const envelope = esEnvelope(cuerpo) ? cuerpo : null

  // Doble verificación: status HTTP (backend nuevo) y flag `success` del cuerpo
  // (backend viejo, y endpoints que devuelven 200 sobre una operación fallida).
  if (!response.ok || indicaFallo(cuerpo)) {
    throw new ApiError(
      extraerMensaje(cuerpo) ?? fallbackMessage,
      envelope?.statusCode ?? response.status,
      envelope?.error?.code,
      envelope?.error?.details
    )
  }

  // 204 o cuerpo vacío: la operación fue exitosa y no hay payload.
  if (cuerpo === null) {
    return undefined as T
  }

  // Con envelope el payload está en `data`; sin envelope, el cuerpo es el payload.
  return (envelope ? envelope.data : cuerpo) as T
}

/**
 * Descarga un archivo (Excel, CSV, PDF) desde el backend.
 *
 * Existe aparte de `apiFetch` porque la respuesta es binaria, pero comparte el
 * manejo de errores: un 500 sigue devolviendo JSON enveloped, y bajarlo como si
 * fuera un `.xlsx` produce un archivo corrupto con un toast de éxito — que es
 * exactamente lo que hacía `reports.service.ts` antes.
 */
export async function apiDownload(
  path: string,
  options: ApiFetchOptions = {}
): Promise<{ blob: Blob; nombreArchivo?: string }> {
  const {
    fallbackMessage = 'Error al generar el archivo.',
    headers: extraHeaders,
    ...init
  } = options

  const headers = getAuthHeaders(
    (extraHeaders as Record<string, string> | undefined) ?? {}
  )

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Verificá tu conexión.',
      0
    )
  }

  if (!response.ok) {
    // El cuerpo del error sí es JSON: lo leemos para mostrar el mensaje real.
    const cuerpo = await parsearJson(response.clone())
    throw new ApiError(
      extraerMensaje(cuerpo) ?? fallbackMessage,
      response.status
    )
  }

  // Un 200 con JSON en un endpoint de archivo es un fallo silencioso del
  // backend: bajarlo como .xlsx produce un archivo corrupto con toast de éxito.
  const tipo = response.headers.get('Content-Type') ?? ''
  if (tipo.includes('application/json')) {
    const cuerpo = await parsearJson(response.clone())
    throw new ApiError(extraerMensaje(cuerpo) ?? fallbackMessage, 200)
  }

  return {
    blob: await response.blob(),
    nombreArchivo: nombreDesdeContentDisposition(
      response.headers.get('Content-Disposition')
    ),
  }
}

/** Extrae `filename` de una cabecera `Content-Disposition`, si viene. */
function nombreDesdeContentDisposition(
  cabecera: string | null
): string | undefined {
  if (!cabecera) return undefined
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cabecera)
  return match?.[1]
}

/** Dispara la descarga de un blob en el navegador. */
export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = window.URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  document.body.removeChild(enlace)
  window.URL.revokeObjectURL(url)
}
