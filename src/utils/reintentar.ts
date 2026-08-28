import { AxiosError } from 'axios'
import { ApiError } from '@/utils/api-client'

/**
 * Si el servidor contestó rechazando, insistir no lo va a hacer cambiar de
 * opinión: falta el permiso, no existe, o los datos están mal.
 *
 * Los 5xx no entran: ahí puede haber una instancia que se cayó y otra que
 * responde. Tampoco entra lo que nunca llegó a hablar con el servidor —una red
 * cortada es exactamente el caso para el que reintentar existe.
 */
export function esRespuestaDelServidor(error: unknown): boolean {
  const status =
    error instanceof ApiError
      ? error.statusCode
      : error instanceof AxiosError
        ? (error.response?.status ?? 0)
        : 0

  return status >= 400 && status < 500
}

/**
 * Cuántas veces reintentar una consulta.
 *
 * La condición anterior sólo perdonaba 401 y 403, y sólo si el error era un
 * `AxiosError` — pero acá nadie pide datos con axios: se importaba en `main.tsx`
 * y en ningún servicio. Así que la excepción no se cumplía nunca y CUALQUIER
 * error se reintentaba cuatro veces, un 404 incluido. Con la espera creciente
 * entre intentos, eso son unos quince segundos hasta que la pantalla puede
 * decir qué pasó, y cuatro peticiones fallidas en lugar de una.
 */
export function convieneReintentar(
  intentosFallidos: number,
  error: unknown,
  maximo = 3
): boolean {
  if (intentosFallidos > maximo) return false

  return !esRespuestaDelServidor(error)
}
