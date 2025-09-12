// Interface for client information
export interface Cliente {
  id: string
  email: string
  apellido: string
  nombre: string
  nombreCompleto: string
  fechaNacimiento: string
  sexo: 'M' | 'F'
  nacionalidad: string
  paisResidencia: string
  telefono: string
  ocupacion: string
  observaciones: string
  createdAt: string
  updatedAt: string
}

// Interface for client sales statistics
export interface EstadisticasVentas {
  totalVentas: number
  ventasPagadas: number
  ventasPendientes: number
  ventasCanceladas: number
  ventasExpiradas: number
  ventasFallidas: number
  montoTotalPagado: number
  montoTotalPendiente: number
  primeraVenta?: string
  ultimaVenta?: string
}

// Interface for individual client with statistics
export interface ClienteConEstadisticas {
  cliente: Cliente
  estadisticasVentas: EstadisticasVentas
}

// Interface for general summary
export interface ResumenGeneral {
  totalClientes: number
  clientesConVentas: number
  clientesSinVentas: number
  ventasTotales: number
  montoTotalVentas: number
}

// Main interface for clients list response
export interface ClientesListResponse {
  data: ClienteConEstadisticas[]
  total: number
  page: string
  limit: string
  totalPages: number
  resumenGeneral: ResumenGeneral
}

// Interface for clients search parameters
export interface ClientesSearchParams {
  termino?: string
  email?: string
  tipoDocumento?: string
  numeroDocumento?: string
  nacionalidad?: string
  fechaRegistroDesde?: string
  fechaRegistroHasta?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}
