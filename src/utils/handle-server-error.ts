import { AxiosError } from 'axios'
import { toast } from 'sonner'
import { ApiError } from './api-client'

/**
 * Traduce cualquier error de red a un texto mostrable.
 *
 * Antes leía `error.response?.data.title` — una forma de ASP.NET/ProblemDetails
 * que NestJS no produce nunca. El resultado era que **todo** error terminaba en
 * "Something went wrong!", o peor: `errMsg` quedaba en `undefined` y el toast
 * salía vacío.
 *
 * Orden de preferencia:
 * 1. `ApiError` — ya trae el `message` del envelope del backend.
 * 2. `AxiosError` — se busca el mensaje dentro del cuerpo de la respuesta.
 * 3. Cualquier `Error` — su propio `message`.
 */
export function obtenerMensajeDeError(error: unknown): string {
  const generico = 'No se pudo completar la operación.'

  if (error instanceof ApiError) {
    return error.message || generico
  }

  if (error instanceof AxiosError) {
    const cuerpo = error.response?.data as Record<string, unknown> | undefined

    if (cuerpo) {
      for (const clave of ['message', 'mensaje', 'error'] as const) {
        const valor = cuerpo[clave]
        if (typeof valor === 'string' && valor.length > 0) return valor
      }
    }

    if (error.response?.status === 204) return 'La respuesta llegó vacía.'
    return error.message || generico
  }

  if (error instanceof Error) {
    return error.message || generico
  }

  if (typeof error === 'string' && error.length > 0) return error

  return generico
}

export function handleServerError(error: unknown) {
  toast.error(obtenerMensajeDeError(error))
}
