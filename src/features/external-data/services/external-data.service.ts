const API_URL = import.meta.env.VITE_API_URL

export interface ExternalDataFilters {
  horaDesde?: string // HH:mm
  horaHasta?: string // HH:mm
  empresa?: string
  destino?: string
  diasSemana?: string // separados por coma
  page?: number // Página para paginación
  limit?: number // Límite de resultados por página
}

export interface ExternalDataItem {
  id: string
  horario: string
  dias: string
  destino: string
  empresa: string
  boleteria: string
  tiposServicio: string
  itinerarioObservacion: string
  formaPago: string
  contacto: string | null
}

export interface PaginatedExternalDataResponse {
  success: boolean
  statusCode: number
  message: string
  data: {
    items: ExternalDataItem[]
    total: number
    page: string
    limit: string
    totalPages: number
  }
}

/**
 * Servicio para obtener datos externos desde el API
 */
export class ExternalDataService {
  /**
   * Obtiene datos externos paginados con filtros opcionales
   * @param filters - Filtros opcionales para la consulta incluyendo paginación
   * @returns Promise con respuesta paginada de datos externos
   */
  static async getExternalData(filters: ExternalDataFilters = {}): Promise<PaginatedExternalDataResponse> {
    const params = new URLSearchParams()
    
    // Agregar filtros solo si tienen valor
    if (filters.horaDesde) params.append('horaDesde', filters.horaDesde)
    if (filters.horaHasta) params.append('horaHasta', filters.horaHasta)
    if (filters.empresa) params.append('empresa', filters.empresa)
    if (filters.destino) params.append('destino', filters.destino)
    if (filters.diasSemana) params.append('diasSemana', filters.diasSemana)
    
    // Agregar parámetros de paginación
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    const response = await fetch(`${API_URL}/api/datos-externos?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener datos externos: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Busca datos externos con término de búsqueda
   * @param searchTerm - Término de búsqueda
   * @param filters - Filtros adicionales
   * @returns Promise con respuesta paginada de datos externos
   */
  static async searchExternalData(
    searchTerm: string, 
    filters: ExternalDataFilters = {}
  ): Promise<PaginatedExternalDataResponse> {
    // Para búsqueda, podemos usar el campo 'empresa' o 'destino' como filtro
    // dependiendo de lo que soporte el API
    const searchFilters: ExternalDataFilters = {
      ...filters,
      // Si el API soporta búsqueda general, podríamos agregar un parámetro 'search'
      // Por ahora, usamos empresa como filtro de búsqueda
      empresa: searchTerm || filters.empresa,
    }
    
    return this.getExternalData(searchFilters)
  }
}
