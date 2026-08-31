import type { DatosDelPasajero } from '../utils/los-datos-del-pasajero'
import { ParadaHomologada, Servicio, ServiceCharge } from '../services/sales.service'
import { VentaExitosa } from '../services/confirmar-venta'

// Re-export types from service for consistency
export type {
  ParadaHomologada,
  Servicio,
  EmpresaServicios,
  ServiciosSearchParams,
  ServiceCharge
} from '../services/sales.service'

// Re-export types from confirmar-venta service
export type {
  VentaExitosa
} from '../services/confirmar-venta'

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
  agenciaId?: string
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
  /**
   * Dónde va la butaca dentro del piso.
   *
   * Las manda la transportista y el backend ya las guarda —`asientoData.Fila`
   * y `asientoData.Columna` en `asiento.service.ts`—, pero este modelo no las
   * declaraba, así que el plano las tiraba y armaba las filas partiendo el
   * arreglo por índice. Por eso no se parecía a un colectivo.
   *
   * Opcionales porque el backend cae a `1` cuando la empresa no las informa: en
   * ese caso todas comparten fila y no hay posición que dibujar.
   */
  fila?: number
  columna?: string
}

// Interface for bus configuration
export interface ConfiguracionBus {
  filas: number
  columnas: number
  pisos: number
  /** Las letras de columna, en orden: ['A', 'B', 'C', 'D']. */
  tipoColumnas?: string[]
  /** Dónde cae el pasillo en cada piso: '2-2', '1-2-1'. */
  distribuciones?: { piso: number; esquema: string }[]
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
  agenciaId: string
}

// Interface for bloquear asientos request
export interface BloquearAsientosRequest {
  servicioId: string
  origenId: string
  destinoId: string
  asientos: string[]
  agenciaId: string
}

// Interface for bloquear asientos response
export type {
  BloquearAsientosApiResponse as BloquearAsientosResponse,
  LiberarBloqueoApiResponse as LiberarBloqueoResponse,
} from '../services/sales.service'

// Interface for liberar bloqueo request
export interface LiberarBloqueoRequest {
  codigoReferencia: string
}

// Round Trip Types
export interface TripData {
  origen?: ParadaHomologada | null
  destino?: ParadaHomologada | null
  fecha?: Date | null
  servicio?: Servicio
  agenciaId?: string // UUID de la empresa
  serviceCharge?: ServiceCharge // Cargo por servicio de la empresa
  asientos?: Asiento[]
  codigoReferencia?: string
  /** Momento en que expira el bloqueo (ISO). El backend lo fija en 30 minutos. */
  bloqueoExpiraEn?: string
  ventaConfirmada?: VentaExitosa
}

export interface RoundTripSearchData {
  ida: TripData
  vuelta?: TripData
  /**
   * Los pasajeros cargados en la planilla, en el orden de las butacas.
   *
   * Viven en la compra y no en el tramo: el mismo grupo viaja de ida y de
   * vuelta. Están acá y no en el estado de la pantalla porque cargar dieciocho
   * lleva su rato y volver del resumen a corregir un apellido no puede
   * significar tipearlo todo otra vez.
   */
  pasajeros?: DatosDelPasajero[]
}

/**
 * Los seis pasos de una venta de mostrador.
 *
 * `checkout` carga los pasajeros y `resumen` revisa, elige cómo se paga y
 * confirma. Estaban juntos en una pantalla, así que el vendedor confirmaba una
 * venta de dieciocho pasajes sin haberla podido leer.
 */
export type RoundTripStep =
  | 'search'
  | 'ida-seats'
  | 'servicios-vuelta'
  | 'vuelta-seats'
  | 'checkout'
  | 'resumen'
  | 'payment'

export interface RoundTripContextType {
  roundTripData: RoundTripSearchData
  currentStep: RoundTripStep
  setRoundTripData: (data: Partial<RoundTripSearchData>) => void
  setCurrentStep: (step: RoundTripStep) => void
  resetRoundTrip: () => void
}

/**
 * Pasajero ya dado de alta en el backend.
 *
 * `clienteId` es el id que devolvió `POST /api/clientes`. Guardarlo es lo que
 * evita el bug anterior: el formulario creaba el cliente, tiraba la respuesta y
 * el checkout lo volvía a crear para conseguir el id. Cada pasajero se daba de
 * alta dos veces, con dos sincronizaciones SOAP contra la empresa.
 */
export interface PasajeroRegistrado {
  clienteId: string
  passengerNumber: number
  seatNumber?: number
  nombre: string
  apellido: string
  email: string
  numeroDocumento?: string
}