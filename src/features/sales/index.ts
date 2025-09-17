// Components
export { SalesPage } from './components/sales-page'
export { DateFilters } from './components/date-filters'
export { ServiciosList } from './components/servicios-list'

// Paradas components
export * from './components/paradas'

// Asientos components
export * from './components/asientos'

// Hooks
export { useGetParadasHomologadas } from './hooks/use-get-paradas-homologadas'
export { useGetServicios } from './hooks/use-get-servicios'
export { useGetAsientos } from './hooks/use-get-asientos'

// Services
export { 
  searchParadasHomologadas, 
  getServiciosPorDestinos,
  consultarAsientos
} from './services/sales.service'

// Models
export type {
  ParadaHomologada,
  Servicio,
  EmpresaServicios,
  ServiciosSearchParams,
  SearchFormData,
  SearchFilters,
  Asiento,
  ConfiguracionBus,
  ServicioInfo,
  AsientosResponse,
  ConsultarAsientosRequest
} from './models/sales.model'
