const API_URL = import.meta.env.VITE_API_URL

export interface ExternalDataFilters {
  horaDesde?: string // HH:mm
  horaHasta?: string // HH:mm
  empresa?: string
  destino?: string
  diasSemana?: string // separados por coma
}

export interface ExternalDataItem {
  id: string
  horario: string
  dias: string
  destino: string
  empresa: string
  boleteria: string
  tiposServicio: string
  itinerarioobservacion: string
  formaPago: string
  contacto: string
}

/**
 * Servicio para obtener datos externos desde el API
 */
export class ExternalDataService {
  /**
   * Obtiene todos los datos externos con filtros opcionales
   * @param filters - Filtros opcionales para la consulta
   * @returns Promise con array de datos externos
   */
  static async getExternalData(filters: ExternalDataFilters = {}): Promise<ExternalDataItem[]> {
    const params = new URLSearchParams()
    
    // Agregar filtros solo si tienen valor
    if (filters.horaDesde) params.append('horaDesde', filters.horaDesde)
    if (filters.horaHasta) params.append('horaHasta', filters.horaHasta)
    if (filters.empresa) params.append('empresa', filters.empresa)
    if (filters.destino) params.append('destino', filters.destino)
    if (filters.diasSemana) params.append('diasSemana', filters.diasSemana)

    const response = await fetch(`${API_URL}/api/datos-externos?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    return response.json()
  }

  /**
   * Aplica paginación del lado del cliente a los datos
   * @param data - Array de datos a paginar
   * @param page - Página actual (empezando en 1)
   * @param pageSize - Tamaño de página
   * @returns Objeto con datos paginados y metadatos
   */
  static paginateData<T>(
    data: T[], 
    page: number, 
    pageSize: number
  ): {
    items: T[]
    totalItems: number
    totalPages: number
    currentPage: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  } {
    const totalItems = data.length
    const totalPages = Math.ceil(totalItems / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const items = data.slice(startIndex, endIndex)

    return {
      items,
      totalItems,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  }

  /**
   * Filtra datos del lado del cliente por texto
   * @param data - Array de datos a filtrar
   * @param searchTerm - Término de búsqueda
   * @returns Array de datos filtrados
   */
  static filterDataBySearch(data: ExternalDataItem[], searchTerm: string): ExternalDataItem[] {
    if (!searchTerm.trim()) return data

    const term = searchTerm.toLowerCase()
    return data.filter(item => 
      item.empresa.toLowerCase().includes(term) ||
      item.destino.toLowerCase().includes(term) ||
      item.horario.toLowerCase().includes(term) ||
      item.dias.toLowerCase().includes(term) ||
      item.boleteria.toLowerCase().includes(term) ||
      item.tiposServicio.toLowerCase().includes(term) ||
      item.formaPago.toLowerCase().includes(term) ||
      item.contacto.toLowerCase().includes(term)
    )
  }
}
