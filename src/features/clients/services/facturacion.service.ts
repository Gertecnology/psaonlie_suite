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

/** Lo que se manda al guardar un titular. El backend hace upsert por documento. */
export interface TitularAGuardar {
  documento: string
  razonSocial: string
  tipoDocumento?: 'RUC' | 'CI'
  email?: string
  direccion?: string
  telefono?: string
  esPredeterminado?: boolean
}

/**
 * Guarda un titular, nuevo o corregido.
 *
 * Es el mismo endpoint para los dos casos: el backend busca por documento y
 * actualiza el que encuentre. Un titular no se identifica por su id sino por su
 * número, que es lo que la DNIT usa para saber a quién se le facturó.
 */
export async function guardarTitular(
  clienteId: string,
  datos: TitularAGuardar
): Promise<TitularDeFacturacion> {
  return apiFetch<TitularDeFacturacion>(
    `/api/clientes/${encodeURIComponent(clienteId)}/facturacion`,
    {
      method: 'POST',
      body: JSON.stringify(datos),
      fallbackMessage: 'No se pudo guardar el titular.',
    }
  ) as Promise<TitularDeFacturacion>
}

/** De dónde salieron los datos de un documento. */
export interface DocumentoResuelto {
  origen: 'libreta' | 'padron' | 'no-encontrado'
  razonSocial?: string
  tipoDocumento?: 'RUC' | 'CI'
  documento?: string
  email?: string
  direccion?: string
  telefono?: string
  estadoPadron?: string
}

/**
 * Resuelve un documento para completar el formulario.
 *
 * Mira primero la libreta del cliente y sólo después el padrón: lo que él
 * guardó es lo que quiere que diga su factura, y puede diferir de lo que la
 * DNIT tenga registrado.
 */
export async function resolverDocumento(
  clienteId: string,
  documento: string
): Promise<DocumentoResuelto | null> {
  return apiFetch<DocumentoResuelto>(
    `/api/clientes/${encodeURIComponent(clienteId)}/facturacion/buscar?documento=${encodeURIComponent(documento)}`,
    { fallbackMessage: 'No se pudo consultar el documento.' }
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
