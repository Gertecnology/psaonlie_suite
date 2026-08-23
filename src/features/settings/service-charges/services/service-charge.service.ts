import {
  type ServiceCharge,
  type PaginatedServiceChargesResponse,
  type ServiceChargeFormValues,
  type CreateServiceChargeFormValues,
} from '../models/service-charge.model'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Filters `GET /service-charges` understands.
 *
 * They all reach the backend on purpose. Before, the name box and the three
 * facets were TanStack column filters running on top of a server-paged list,
 * so they only ever matched among the rows already on screen: a charge on
 * page three was unfindable, and the count in the pager stopped matching what
 * the table showed.
 */
export interface ObtenerServiceChargesParams {
  page?: number
  limit?: number
  /** Partial match on the name. */
  nombre?: string
  tipoAplicacion?: 'PORCENTUAL' | 'FIJO'
  esGlobal?: boolean
  activo?: boolean
}

// Service to get service charges
export async function getServiceCharges({
  page = 1,
  limit = 10,
  nombre,
  tipoAplicacion,
  esGlobal,
  activo,
}: ObtenerServiceChargesParams = {}): Promise<PaginatedServiceChargesResponse> {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })

  if (nombre) query.set('nombre', nombre)
  if (tipoAplicacion) query.set('tipoAplicacion', tipoAplicacion)
  // Comparación explícita contra `undefined`: `false` es un filtro válido y un
  // chequeo de verdad lo tiraría a la basura.
  if (esGlobal !== undefined) query.set('esGlobal', String(esGlobal))
  if (activo !== undefined) query.set('activo', String(activo))

  const response = await fetch(`${API_URL}/service-charges?${query}`, {
    headers: {
      'accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error('Error al obtener los cargos por servicio')
  }

  const result = await response.json()

  // La respuesta tiene la estructura: { success, statusCode, message, data }
  if (result.success && result.data) {
    return result.data
  }

  // Fallback: crear una estructura válida
  return {
    items: [],
    total: 0,
    page: page.toString(),
    limit: limit.toString(),
    totalPages: 0,
  }
}

// Service to create a service charge
export async function createServiceCharge(data: CreateServiceChargeFormValues): Promise<ServiceCharge> {
  const token = localStorage.getItem('accessToken')
  
  const response = await fetch(`${API_URL}/service-charges`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al crear el cargo por servicio')
  }

  return response.json()
}

// Service to update a service charge
export async function updateServiceCharge(
  id: string,
  data: ServiceChargeFormValues
): Promise<ServiceCharge> {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${API_URL}/service-charges/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Error al actualizar el cargo por servicio')
  }
  return response.json()
}

// Service to delete a service charge
export async function deleteServiceCharge(id: string): Promise<void> {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${API_URL}/service-charges/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Error al eliminar el cargo por servicio')
  }
}

// Service to get service charge by id
export async function getServiceChargeById(id: string): Promise<ServiceCharge> {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${API_URL}/service-charges/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!response.ok) {
    throw new Error('Error al obtener el cargo por servicio')
  }
  const result = await response.json()
  return result.data
}

// Service to assign service charge to company
export async function assignServiceChargeToCompany(
  agenciaId: string,
  serviceChargeId: string
): Promise<void> {
  const token = localStorage.getItem('accessToken')
  const response = await fetch(`${API_URL}/service-charges/empresa/${agenciaId}/assign/${serviceChargeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al asignar el cargo por servicio a la empresa')
  }
}
