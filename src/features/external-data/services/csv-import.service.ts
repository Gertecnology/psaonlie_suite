const API_URL = import.meta.env.VITE_API_URL

export interface CsvImportRequest {
  limpiarAntes: boolean
  archivo: File
}

export interface CsvImportResponse {
  exito: boolean
  mensaje: string
  totalProcesados: number
  totalInsertados: number
  totalErrores: number
  errores: string[]
  tiempoProcesamiento: number
}

/**
 * Servicio para importar datos desde archivos CSV
 */
export class CsvImportService {
  /**
   * Importa horarios y rutas desde un archivo CSV
   * @param data - Datos de la importación (archivo y opciones)
   * @returns Promise con el resultado de la importación
   */
  static async importarHorariosCsv(data: CsvImportRequest): Promise<CsvImportResponse> {
    const formData = new FormData()
    formData.append('limpiarAntes', data.limpiarAntes.toString())
    formData.append('archivo', data.archivo)

    const response = await fetch(`${API_URL}/api/importar-horarios-csv`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.json()
  }

  /**
   * Valida si un archivo es un CSV válido
   * @param file - Archivo a validar
   * @returns true si es válido, false si no
   */
  static validateCsvFile(file: File): { isValid: boolean; error?: string } {
    // Verificar que sea un archivo CSV
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return {
        isValid: false,
        error: 'El archivo debe ser un CSV (.csv)'
      }
    }

    // Verificar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'El archivo no puede ser mayor a 10MB'
      }
    }

    // Verificar que no esté vacío
    if (file.size === 0) {
      return {
        isValid: false,
        error: 'El archivo no puede estar vacío'
      }
    }

    return { isValid: true }
  }
}
