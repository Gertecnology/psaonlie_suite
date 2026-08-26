import { apiFetchRaw } from '@/utils/api-client'
import {
  ClientesListResponse,
  ClientesSearchParams,
  Cliente,
  CreateClientFormValues,
  UpdateClientFormValues,
  CreateClientResponse,
} from '../models/clients.model'

/**
 * Todos los endpoints de `/api/clientes` devuelven el objeto directamente, sin
 * el envelope `{ success, data }` que usan empresas y destinos. Por eso van con
 * `apiFetchRaw`: `apiFetch` devolvería `undefined` al buscar un `data` que no
 * existe.
 *
 * El alta y la búsqueda pegan contra el web service de la empresa, así que
 * necesitan más margen que una consulta local.
 */
const TIMEOUT_SINCRONIZACION_MS = 60_000

export async function getClientesList(
  params: ClientesSearchParams,
): Promise<ClientesListResponse> {
  const searchParams = new URLSearchParams()

  searchParams.append('page', params.page.toString())
  searchParams.append('limit', params.limit.toString())
  searchParams.append('sortBy', params.sortBy)
  searchParams.append('sortOrder', params.sortOrder)

  if (params.termino) {
    searchParams.append('termino', params.termino)
  }
  if (params.email) {
    searchParams.append('email', params.email)
  }
  if (params.tipoDocumento) {
    searchParams.append('tipoDocumento', params.tipoDocumento)
  }
  if (params.numeroDocumento) {
    searchParams.append('numeroDocumento', params.numeroDocumento)
  }
  if (params.nacionalidad) {
    searchParams.append('nacionalidad', params.nacionalidad)
  }
  if (params.fechaRegistroDesde) {
    searchParams.append('fechaRegistroDesde', params.fechaRegistroDesde)
  }
  if (params.fechaRegistroHasta) {
    searchParams.append('fechaRegistroHasta', params.fechaRegistroHasta)
  }

  return apiFetchRaw<ClientesListResponse>(
    `/api/clientes/admin/lista?${searchParams.toString()}`,
    { fallbackMessage: 'Error al obtener la lista de clientes' },
  )
}

/**
 * Trae un cliente por email.
 *
 * El endpoint real es `GET /api/clientes/:email` y devuelve el cliente plano.
 * El código anterior le pasaba un id y leía `data.data`, un campo que este
 * endpoint no tiene: devolvía `undefined` sin fallar.
 */
export async function getClientePorEmail(email: string): Promise<Cliente> {
  return apiFetchRaw<Cliente>(`/api/clientes/${encodeURIComponent(email)}`, {
    fallbackMessage: 'Error al obtener el cliente',
  })
}

/**
 * Crea o actualiza un cliente (el backend hace upsert por email) y lo
 * sincroniza con la empresa.
 */
export async function createClient(
  data: CreateClientFormValues,
): Promise<CreateClientResponse> {
  const respuesta = await apiFetchRaw<CreateClientResponse>('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
    fallbackMessage: 'Error al crear el cliente',
    timeoutMs: TIMEOUT_SINCRONIZACION_MS,
  })

  if (!respuesta?.cliente?.id) {
    throw new Error(
      'El servidor no devolvió el cliente creado. Verificá en el listado de clientes antes de reintentar.',
    )
  }

  return respuesta
}

export async function updateClient(
  email: string,
  data: UpdateClientFormValues,
): Promise<Cliente> {
  return apiFetchRaw<Cliente>(`/api/clientes/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    fallbackMessage: 'Error al actualizar el cliente',
    timeoutMs: TIMEOUT_SINCRONIZACION_MS,
  })
}

export async function deleteClient(id: string): Promise<void> {
  await apiFetchRaw<void>(`/api/clientes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    fallbackMessage: 'Error al eliminar el cliente',
  })
}
