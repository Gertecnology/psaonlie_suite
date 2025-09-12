import {
  type ServiceCharge,
  type PaginatedServiceChargesResponse,
  type ServiceChargeFormValues,
  type CreateServiceChargeFormValues,
} from '../models/service-charge.model'

const API_URL = import.meta.env.VITE_API_URL

// Service to get service charges
export async function getServiceCharges(
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedServiceChargesResponse> {
  const response = await fetch(`${API_URL}/service-charges?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Error al obtener los cargos por servicio')
  }
  const result = await response.json()
  return result.data
}

// Service to create a service charge
export async function createServiceCharge(data: CreateServiceChargeFormValues): Promise<ServiceCharge> {
  const token = localStorage.getItem('token')
  
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
  const token = localStorage.getItem('token')
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
  const token = localStorage.getItem('token')
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
  const token = localStorage.getItem('token')
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
