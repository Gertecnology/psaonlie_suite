import { apiFetch } from '@/utils/api-client'

export interface TitularDeFacturacion {
  id: string
  tipoDocumento: string
  documento: string
  razonSocial: string
  email: string | null
  direccion: string | null
  telefono: string | null
  /** Con cuál viene precargado el checkout. */
  esPredeterminado: boolean
  /** Lo que dijo el padrón la última vez: `ACTIVO`, `SUSPENDIDO`… */
  estadoPadron: string | null
  consultadoAlPadronEn: string | null
}

/**
 * La libreta de facturación de un cliente.
 *
 * Son varios titulares por persona: quien viaja y quien paga no siempre son el
 * mismo, y una misma persona puede facturar a nombre propio o de su empresa.
 * El backend los devuelve con el predeterminado primero.
 */
export async function obtenerLibreta(
  clienteId: string
): Promise<TitularDeFacturacion[]> {
  const libreta = await apiFetch<TitularDeFacturacion[]>(
    `/api/clientes/${encodeURIComponent(clienteId)}/facturacion`,
    { fallbackMessage: 'Error al obtener los datos de facturación.' }
  )
  return libreta ?? []
}

/**
 * Marca cuál viene elegido al comprar.
 *
 * El backend se encarga de desmarcar el anterior: si lo hiciera la pantalla,
 * dos pestañas abiertas podrían dejar dos predeterminados.
 */
export async function marcarPredeterminado(
  clienteId: string,
  titularId: string
): Promise<void> {
  await apiFetch<void>(
    `/api/clientes/${encodeURIComponent(clienteId)}/facturacion/${encodeURIComponent(titularId)}/predeterminado`,
    { method: 'POST', fallbackMessage: 'No se pudo marcar el predeterminado.' }
  )
}

export async function quitarTitular(
  clienteId: string,
  titularId: string
): Promise<void> {
  await apiFetch<void>(
    `/api/clientes/${encodeURIComponent(clienteId)}/facturacion/${encodeURIComponent(titularId)}`,
    { method: 'DELETE', fallbackMessage: 'No se pudo quitar el titular.' }
  )
}
