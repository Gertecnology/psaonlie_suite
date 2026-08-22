// Interface for empresa information
export interface Empresa {
  id: string
  nombre: string
  datoExterno: boolean
}

// Interface for empresas list response
export interface AgenciasListResponse {
  success: boolean
  statusCode: number
  message: string
  data: Empresa[]
}

// Interface for empresas search parameters (for future use)
export type AgenciasSearchParams = object
