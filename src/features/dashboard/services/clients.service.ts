import { ClientesListResponse, ClientesSearchParams } from '../models/clients.model'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Service to get paginated list of clients with sales statistics
 * @param params - Search parameters for filtering clients
 * @returns Promise<ClientesListResponse> - Paginated clients data with statistics
 */
export async function getClientesList(params: ClientesSearchParams = {}): Promise<ClientesListResponse> {
  // Build query parameters
  const queryParams = new URLSearchParams()

  // Add parameters if provided
  if (params.termino) queryParams.append('termino', params.termino)
  if (params.email) queryParams.append('email', params.email)
  if (params.tipoDocumento) queryParams.append('tipoDocumento', params.tipoDocumento)
  if (params.numeroDocumento) queryParams.append('numeroDocumento', params.numeroDocumento)
  if (params.nacionalidad) queryParams.append('nacionalidad', params.nacionalidad)
  if (params.fechaRegistroDesde) queryParams.append('fechaRegistroDesde', params.fechaRegistroDesde)
  if (params.fechaRegistroHasta) queryParams.append('fechaRegistroHasta', params.fechaRegistroHasta)
  if (params.page !== undefined) queryParams.append('page', params.page.toString())
  if (params.limit !== undefined) queryParams.append('limit', params.limit.toString())
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const response = await fetch(`${API_URL}/api/clientes/admin/lista?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado para acceder a la lista de clientes')
    }
    if (response.status === 403) {
      throw new Error('Permisos insuficientes para ver clientes')
    }
    if (response.status === 500) {
      throw new Error('Error interno del servidor al obtener clientes')
    }
    throw new Error('Error al obtener lista de clientes')
  }

  const result: ClientesListResponse = await response.json()
  return result
}
