const API_URL = import.meta.env.VITE_API_URL

export interface DayConfiguration {
  id: string
  textoOriginal: string
  diaSemana: string
  descripcion: string
  activo: boolean
  fechaCreacion: string
  fechaActualizacion: string
}

export interface CreateDayConfigurationRequest {
  textoOriginal: string
  diaSemana: string
  descripcion: string
}

export interface UpdateDayConfigurationRequest {
  diaSemana?: string
  descripcion?: string
  activo?: boolean
}

export interface DayConfigurationResponse {
  success: boolean
  statusCode: number
  message: string
  data: DayConfiguration
}

export interface UniqueDaysResponse {
  success: boolean
  statusCode: number
  message: string
  data: string[]
}

export interface DayConfigurationStatistics {
  totalConfiguradas: number
  totalSinConfigurar: number
  porDiaSemana: Record<string, number>
  diasSinConfigurar: string[]
}

export interface BatchConfigurationRequest {
  configuraciones: CreateDayConfigurationRequest[]
}

export interface BatchConfigurationResponse {
  success: boolean
  statusCode: number
  message: string
  data: {
    configuracionesCreadas: number
    configuracionesExitosas: DayConfiguration[]
    configuracionesFallidas: Array<{
      configuracion: CreateDayConfigurationRequest
      error: string
    }>
  }
}

export interface UnconfiguredDaysResponse {
  diasSinConfigurar: string[]
  total: number
}

/**
 * Servicio para manejar la configuración de días únicos
 */
export class DayConfigurationService {
  /**
   * Obtiene todos los días únicos disponibles
   * @returns Promise con lista de días únicos
   */
  static async getUniqueDays(): Promise<UniqueDaysResponse> {
    const response = await fetch(`${API_URL}/api/dias-unicos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener días únicos: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Crea una nueva configuración de día
   * @param config - Datos de la configuración a crear
   * @returns Promise con la configuración creada
   */
  static async createDayConfiguration(config: CreateDayConfigurationRequest): Promise<DayConfigurationResponse> {
    const response = await fetch(`${API_URL}/api/configuracion-dias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    
    if (!response.ok) {
      throw new Error(`Error al crear configuración de día: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Obtiene todas las configuraciones de días existentes
   * @returns Promise con lista de configuraciones
   */
  static async getDayConfigurations(): Promise<DayConfiguration[]> {
    const response = await fetch(`${API_URL}/api/configuracion-dias`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener configuraciones de días: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    // El API retorna directamente un array de configuraciones
    return Array.isArray(result) ? result : []
  }

  /**
   * Obtiene estadísticas de configuraciones de días
   * @returns Promise con estadísticas de configuraciones
   */
  static async getDayConfigurationStatistics(): Promise<DayConfigurationStatistics> {
    const response = await fetch(`${API_URL}/api/estadisticas-dias`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener estadísticas de días: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Obtiene los días de la semana disponibles
   * @returns Promise con lista de días únicos disponibles
   */
  static async getAvailableWeekDays(): Promise<string[]> {
    const response = await fetch(`${API_URL}/api/dias-semana-disponibles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener días de semana disponibles: ${response.status} ${response.statusText}`)
    }
    
    const result = await response.json()
    return Array.isArray(result) ? result : []
  }

  /**
   * Obtiene los días sin configurar
   * @returns Promise con días sin configurar y total
   */
  static async getUnconfiguredDays(): Promise<UnconfiguredDaysResponse> {
    const response = await fetch(`${API_URL}/api/dias-sin-configurar`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener días sin configurar: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Crea configuraciones de días en lote
   * @param configuraciones - Array de configuraciones a crear
   * @returns Promise con resultado del lote
   */
  static async createBatchDayConfigurations(configuraciones: CreateDayConfigurationRequest[]): Promise<BatchConfigurationResponse> {
    const response = await fetch(`${API_URL}/api/configuracion-dias/lote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ configuraciones }),
    })
    
    if (!response.ok) {
      if (response.status === 500) {
        throw new Error('Error interno del servidor')
      }
      throw new Error(`Error al crear configuraciones en lote: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Actualiza una configuración de día existente
   * @param id - ID de la configuración
   * @param config - Datos actualizados
   * @returns Promise con la configuración actualizada
   */
  static async updateDayConfiguration(id: string, config: UpdateDayConfigurationRequest): Promise<DayConfigurationResponse> {
    const response = await fetch(`${API_URL}/api/configuracion-dias/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    
    if (!response.ok) {
      throw new Error(`Error al actualizar configuración de día: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }

  /**
   * Elimina una configuración de día
   * @param id - ID de la configuración
   * @returns Promise con resultado de la eliminación
   */
  static async deleteDayConfiguration(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_URL}/api/configuracion-dias/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Configuración no encontrada')
      }
      if (response.status === 500) {
        throw new Error('Error interno del servidor')
      }
      throw new Error(`Error al eliminar configuración de día: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }
}
