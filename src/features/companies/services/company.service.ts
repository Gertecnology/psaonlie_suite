import {
  type Company,
  type PaginatedCompaniesResponse,
  type CompanyFormValues,
  type CreateCompanyFormValues,
} from '../models/company.model'

const API_URL = import.meta.env.VITE_API_URL

// Service to get companies
export async function getCompanies(
  token: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedCompaniesResponse> {
  const response = await fetch(`${API_URL}/empresas?page=${page}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Error al obtener las empresas')
  }
  const result = await response.json()
  return result.data
}

// Service to update a company
export async function updateCompany(
  id: string,
  data: CompanyFormValues
): Promise<Company> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/empresas/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Error al actualizar la empresa')
  }
  return response.json()
}

// Service to delete a company
export async function deleteCompany(id: string): Promise<void> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/empresas/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('Error al eliminar la empresa')
  }
}

// Service to create a company
export async function createCompany(data: CreateCompanyFormValues): Promise<Company> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/empresas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al crear la empresa')
  }

  return response.json()
} 