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

export function leerTiemposDeReserva(): Promise<ConfiguracionDeReservas> {
  return apiFetchRaw<ConfiguracionDeReservas>('/api/agencias/tiempos-de-reserva', {
    fallbackMessage: 'No se pudieron leer los tiempos de reserva',
  })
}

export function guardarTiemposDeReserva(
  tiempos: TiemposDeReserva,
): Promise<ConfiguracionDeReservas> {
  return apiFetchRaw<ConfiguracionDeReservas>('/api/agencias/tiempos-de-reserva', {
    method: 'PATCH',
    body: JSON.stringify(tiempos),
    fallbackMessage: 'No se pudieron guardar los tiempos de reserva',
  })
}
