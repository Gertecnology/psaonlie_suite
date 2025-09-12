// Interface for empresa information
export interface Empresa {
  id: string
  nombre: string
  datoExterno: boolean
}

// Interface for empresas list response
export interface EmpresasListResponse {
  success: boolean
  statusCode: number
  message: string
  data: Empresa[]
}

// Interface for empresas search parameters (for future use)
export type EmpresasSearchParams = object
