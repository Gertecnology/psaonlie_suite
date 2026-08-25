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
