import { ClientesListResponse, ClientesSearchParams, ClienteConEstadisticas } from '../models/clients.model'

const API_URL = import.meta.env.VITE_API_URL

export async function getClientesList(params: ClientesSearchParams): Promise<ClientesListResponse> {
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

  const response = await fetch(`${API_URL}/api/clientes/admin/lista?${searchParams.toString()}`)
  
  if (!response.ok) {
    throw new Error('Error al obtener la lista de clientes')
  }

  return response.json()
}

export async function getClienteById(id: string): Promise<ClienteConEstadisticas> {
  const response = await fetch(`${API_URL}/api/clientes/${id}`)
  
  if (!response.ok) {
    throw new Error('Error al obtener el cliente')
  }

  const data = await response.json()
  return data.data
}

