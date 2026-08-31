import { apiFetchRaw } from '@/utils/api-client'

/** Los tres tiempos que decidimos nosotros. */
export interface TiemposDeReserva {
  margenEmisionMinutos: number
  renovacionesMaximas: number
  inactividadMinutos: number
}

/** Lo que define cada transportista, para consultar al lado. */
export interface TiemposDeUnaEmpresa {
  id: string
  nombre: string
  bloqueoButacasMinutos: number
  ventanaPagoMinutos: number
  ventanaTotalMinutos: number
}

export interface ConfiguracionDeReservas {
  tiempos: TiemposDeReserva
  empresas: TiemposDeUnaEmpresa[]
}

/**
 * La ruta va SIN `/api`.
 *
 * En este backend el prefijo no es global: cada controlador lo declara. El de
 * ventas es `api/ventas`, el de agencias es `agencias` a secas. Escribir
 * `/api/agencias/...` devuelve un 404 que parece de ruta inexistente y en
 * realidad es de prefijo equivocado.
 */
export function leerTiemposDeReserva(): Promise<ConfiguracionDeReservas> {
  return apiFetchRaw<ConfiguracionDeReservas>('/agencias/tiempos-de-reserva', {
    fallbackMessage: 'No se pudieron leer los tiempos de reserva',
  })
}

export function guardarTiemposDeReserva(
  tiempos: TiemposDeReserva,
): Promise<ConfiguracionDeReservas> {
  return apiFetchRaw<ConfiguracionDeReservas>('/agencias/tiempos-de-reserva', {
    method: 'PATCH',
    body: JSON.stringify(tiempos),
    fallbackMessage: 'No se pudieron guardar los tiempos de reserva',
  })
}
