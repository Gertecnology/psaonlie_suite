import { apiFetch, apiFetchRaw } from '@/utils/api-client'
import { Destination, DestinationFormValues, clientSchema } from '../models/destination.model'
import { z } from 'zod'

/**
 * Los endpoints de `/destinos` y `/agencias` responden con el envelope
 * `{ success, statusCode, message, data }`, así que van con `apiFetch`.
 * `/api/clientes` devuelve el objeto plano y va con `apiFetchRaw`.
 *
 * Todos adjuntan el token vía `apiFetch`: antes cada función leía el token a
 * mano y el manejo de errores se apoyaba sólo en `response.ok`, que es `true`
 * para las respuestas 200 con `success: false`.
 */

export interface DestinationsPage {
  items: Destination[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function getDestinations(
  params?: Record<string, string>,
): Promise<DestinationsPage> {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return apiFetch<DestinationsPage>(`/destinos${query}`, {
    fallbackMessage: 'Error al obtener destinos',
  })
}

export async function getDestinationById(id: string): Promise<Destination> {
  return apiFetch<Destination>(`/destinos/${encodeURIComponent(id)}`, {
    fallbackMessage: 'Error al obtener el destino',
  })
}

export async function createDestination(
  data: DestinationFormValues,
): Promise<Destination> {
  return apiFetch<Destination>('/destinos', {
    method: 'POST',
    body: JSON.stringify(data),
    fallbackMessage: 'Error al crear destino',
  })
}

export async function updateDestination(
  id: string,
  data: DestinationFormValues,
): Promise<Destination> {
  return apiFetch<Destination>(`/destinos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
    fallbackMessage: 'Error al actualizar destino',
  })
}

export async function deleteDestination(id: string): Promise<void> {
  await apiFetch<void>(`/destinos/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    fallbackMessage: 'Error al eliminar destino',
  })
}

export interface ParadaHomologadaOption {
  id: string
  descripcion: string
  /** Empresa que reporta esta parada con ese nombre. */
  empresaNombre?: string
  /** Destino al que pertenece hoy, si tiene uno. */
  destinoId?: string | null
  destinoNombre?: string | null
}

// Servicio para obtener paradas homologadas para el selector múltiple
export async function getAllParadasHomologadas(
  descripcion?: string,
): Promise<ParadaHomologadaOption[]> {
  const params = new URLSearchParams()
  if (descripcion) params.append('descripcion', descripcion)
  const query = params.toString() ? `?${params.toString()}` : ''

  const paradas = await apiFetch<ParadaHomologadaOption[]>(
    `/agencias/paradas-homologadas/lista${query}`,
    { fallbackMessage: 'Error al obtener paradas homologadas' },
  )

  return paradas ?? []
}

// Servicio para remover parada homologada
export async function removeParadaHomologada(
  destinationId: string,
  paradaId: string,
): Promise<void> {
  await apiFetch<void>(
    `/destinos/${encodeURIComponent(destinationId)}/paradas/${encodeURIComponent(paradaId)}`,
    {
      method: 'DELETE',
      fallbackMessage: 'Error al remover parada homologada',
    },
  )
}

// Servicio para crear clientes de una empresa
export async function createClient(data: z.infer<typeof clientSchema>): Promise<{
  cliente: {
    id: string
    email: string
    apellido: string
    nombre: string
    nombreCompleto: string
    fechaNacimiento: string
    sexo: string
    nacionalidad: string
    paisResidencia: string
    telefono: string
    ocupacion?: string
    observaciones?: string
    createdAt: string
    updatedAt: string
  }
  clienteEmpresa: {
    id: string
    cliente: {
      id: string
      email: string
      apellido: string
      nombre: string
    }
    agenciaId: string
    empresaNombre: string
    tipoDocumento: string
    numeroDocumento: string
    documentoCompleto: string
    idExterno: string
    sincronizado: boolean
    ultimaSincronizacion: string
    createdAt: string
  }
  sincronizado: boolean
}> {
  return apiFetchRaw('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
    fallbackMessage: 'Error al crear cliente',
  })
}

export interface ParadaDeDestino {
  id: string
  /** Cómo la reporta la empresa. */
  nombre: string
  empresaNombre: string
  /**
   * Si la empresa que la reporta está activa. La parada no tiene estado propio:
   * `paradas_homologadas` no guarda uno.
   */
  activo: boolean
}

export interface ParadasDeDestinoPage {
  items: ParadaDeDestino[]
  total: number
  page: number
  limit: number
  totalPages: number
  /** Las empresas de este destino, para llenar el filtro. */
  empresas: string[]
}

export interface ParadasDeDestinoParams {
  page: number
  limit: number
  search?: string
  activo?: boolean
  empresa?: string
}

/**
 * Una página de las paradas de un destino, filtrada en el servidor.
 *
 * `GET /destinos/:id` las trae todas juntas y sin filtro — sirve para editar el
 * destino, no para buscar dentro de su listado.
 */
export async function getParadasDeDestino(
  destinoId: string,
  params: ParadasDeDestinoParams,
): Promise<ParadasDeDestinoPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  // Los vacíos no se mandan: `search=` haría que el backend filtre por cadena
  // vacía en vez de no filtrar.
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.empresa) query.set('empresa', params.empresa)
  if (params.activo !== undefined) query.set('activo', String(params.activo))

  return apiFetch<ParadasDeDestinoPage>(
    `/destinos/${encodeURIComponent(destinoId)}/paradas?${query.toString()}`,
    { fallbackMessage: 'Error al obtener las paradas del destino' },
  )
}
