import { ParadaHomologada } from '../services/sales.service'

// Re-export types from service for consistency
export type {
  ParadaHomologada,
  Servicio,
  EmpresaServicios,
  ServiciosSearchParams,
  ServiceCharge
} from '../services/sales.service'

// Additional types for the sales page
export interface SearchFormData {
  origen: ParadaHomologada | null
  destino: ParadaHomologada | null
  fechaIda: Date | null
  fechaVuelta: Date | null
}

export interface SearchFilters {
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

// Interface for seat data
export interface Asiento {
  numero: string
  disponible: boolean
  precio: number
  tipo: 'VENTANA' | 'PASILLO' | 'CENTRO'
  piso: number
  calidad: string
}

// Interface for bus configuration
export interface ConfiguracionBus {
  filas: number
  columnas: number
  pisos: number
}

// Interface for service info
export interface ServicioInfo {
  empresa: string
  calidadA: string
  calidadB: string
  calidadDescripcionA: string
  calidadDescripcionB: string
  tarifaA: number
  tarifaB: number
  tarifaAMn: number
  tarifaBMn: number
  parados: number
  paradosVendidos: number
}

// Interface for asientos response
export interface AsientosResponse {
  asientos: Asiento[]
  totalDisponibles: number
  configuracionBus: ConfiguracionBus
  servicioInfo: ServicioInfo
}

// Interface for consultar asientos request
export interface ConsultarAsientosRequest {
  servicioId: string
  origenId: string
  destinoId: string
  empresaId: string
}

// Interface for bloquear asientos request
export interface BloquearAsientosRequest {
  servicioId: string
  origenId: string
  destinoId: string
  asientos: string[]
  empresaId: string
}

// Interface for bloquear asientos response
export interface BloquearAsientosResponse {
  exitoso: boolean
  codigoReferencia: string
  nroConexion: string
  tiempoExpiracion: string
  asientosBloqueados: string[]
  asientosNoDisponibles: string[]
  mensaje: string
}

// Interface for liberar bloqueo request
export interface LiberarBloqueoRequest {
  codigoReferencia: string
}

// Interface for liberar bloqueo response
export interface LiberarBloqueoResponse {
  exitoso: boolean
  mensaje: string
}