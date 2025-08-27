import { ParadaHomologada } from '../services/sales.service'

// Re-export types from service for consistency
export type {
  ParadaHomologada,
  Servicio,
  EmpresaServicios,
  ServiciosSearchParams
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
