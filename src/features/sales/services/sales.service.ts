const API_URL = import.meta.env.VITE_API_URL

// Interface for homologated stop response
export interface ParadaHomologada {
  id: string
  nombre: string
}

// Interface for individual service
export interface Servicio {
  diffgr_id: string
  rowOrder: string
  Id: string
  Emp: string
  Cod: string
  Embarque: string
  Libres: string
  Calidad: string
  Tarifa: string
  Desembarque: string
  fechaembarque: string
  Fec: string
  TextoTarifas: string
  TextoTarifasFull: string
}

// Interface for company services response
export interface EmpresaServicios {
  empresa: string
  data: Servicio[]
  success: boolean
  url: string
  id: string
}

// Interface for search parameters
export interface ServiciosSearchParams {
  origenDestinoId: string
  destinoDestinoId: string
  fecha: string
  horaDesde?: string
  horaHasta?: string
  calidad?: 'CO' | 'SC' | 'CN' | 'SE'
  tarifaMinima?: number
  tarifaMaxima?: number
  asientosMinimos?: number
  empresaId?: string
  ordenarPor?: 'embarque' | 'tarifa' | 'libres' | 'calidad'
  ordenDireccion?: 'asc' | 'desc'
}

// Service to search homologated stops by name
export async function searchParadasHomologadas(searchTerm: string): Promise<ParadaHomologada[]> {
  
  if (!searchTerm.trim()) {
    throw new Error('El término de búsqueda es requerido')
  }

  const response = await fetch(`${API_URL}/api/search-paradas-homologadas?searchTerm=${encodeURIComponent(searchTerm)}`)

  if (!response.ok) {
    throw new Error('Error al buscar paradas homologadas')
  }

  const result: ParadaHomologada[] = await response.json()
  return result
}

// Service to get services by destinations with filters
export async function getServiciosPorDestinos(params: ServiciosSearchParams): Promise<EmpresaServicios[]> {
  const {
    origenDestinoId,
    destinoDestinoId,
    fecha,
    horaDesde,
    horaHasta,
    calidad,
    tarifaMinima,
    tarifaMaxima,
    asientosMinimos,
    empresaId,
    ordenarPor,
    ordenDireccion
  } = params

  // Validate required parameters
  if (!origenDestinoId || !destinoDestinoId || !fecha) {
    throw new Error('Los parámetros origenDestinoId, destinoDestinoId y fecha son requeridos')
  }

  // Build query parameters
  const queryParams = new URLSearchParams({
    origenDestinoId,
    destinoDestinoId,
    fecha
  })

  // Add optional parameters if provided
  if (horaDesde) queryParams.append('horaDesde', horaDesde)
  if (horaHasta) queryParams.append('horaHasta', horaHasta)
  if (calidad) queryParams.append('calidad', calidad)
  if (tarifaMinima !== undefined) queryParams.append('tarifaMinima', tarifaMinima.toString())
  if (tarifaMaxima !== undefined) queryParams.append('tarifaMaxima', tarifaMaxima.toString())
  if (asientosMinimos !== undefined) queryParams.append('asientosMinimos', asientosMinimos.toString())
  if (empresaId) queryParams.append('empresaId', empresaId)
  if (ordenarPor) queryParams.append('ordenarPor', ordenarPor)
  if (ordenDireccion) queryParams.append('ordenDireccion', ordenDireccion)

  const response = await fetch(`${API_URL}/api/servicios-por-destinos?${queryParams.toString()}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Destino no encontrado')
    }
    if (response.status === 500) {
      throw new Error('Error interno del servidor')
    }
    throw new Error('Error al obtener servicios por destinos')
  }

  const result: EmpresaServicios[] = await response.json()
  return result
}

// Service to consult available seats for a service
export async function consultarAsientos(params: {
  servicioId: string
  origenId: string
  destinoId: string
  empresaId: string
}) {
  const { servicioId, origenId, destinoId, empresaId } = params

  // Validate required parameters
  if (!servicioId || !origenId || !destinoId || !empresaId) {
    throw new Error('Todos los parámetros son requeridos: servicioId, origenId, destinoId, empresaId')
  }

  const response = await fetch(`${API_URL}/api/ventas/consultar-asientos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      servicioId,
      origenId,
      destinoId,
      empresaId,
    }),
  })

  if (!response.ok) {
    throw new Error('Error al consultar asientos disponibles')
  }

  const result = await response.json()
  return result
}
