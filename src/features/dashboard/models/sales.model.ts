// Interface for client information in sales
export interface ClienteVenta {
  id: string
  tipoDocumento?: string | null
  numeroDocumento?: string | null
  nombre: string
  apellido: string
  telefono: string
  email: string
  nacionalidad: string
}

// Interface for individual sale
export interface Venta {
  id: string
  numeroTransaccion: string
  empresaId: string
  empresaNombre: string
  usuarioId?: string | null
  clienteId: string
  empresaBoleto: string
  calidad: string
  fechaVenta: string
  fechaViaje: string
  horaSalida: string
  origenId: string
  origenNombre: string
  destinoId: string
  destinoNombre: string
  servicioId: string
  asientosOriginales: string[]
  importeTotal: number
  comisionTotal: number
  porcentajeComisionSnapshot: number
  serviceChargeIdSnapshot: string
  serviceChargeNombreSnapshot: string
  serviceChargeTipoSnapshot: string
  serviceChargePorcentajeSnapshot: number
  serviceChargeMontoFijoSnapshot: number
  serviceChargeMontoTotal: number
  metodoPago: 'BANCARD' | 'WHATSAPP' | 'TRANSFERENCIA' | 'EFECTIVO'
  estadoPago: 'PENDIENTE' | 'PAGADO' | 'EXPIRADO' | 'CANCELADO' | 'FALLIDO' | 'REEMBOLSADO'
  estadoVenta: 'RESERVADO' | 'CONFIRMADO' | 'EXPIRADO' | 'CANCELADO' | 'ANULADO' | 'PENDIENTE_PAGO' | 'PAGO_APROBADO'
  estadoAsientos: 'SIN_RESERVAR' | 'BLOQUEADO' | 'LIBERADO' | 'CONFIRMADO' | 'NO_DISPONIBLE'
  fechaExpiracionPago?: string | null
  referenciaPago?: string | null
  bancardTransactionId?: string | null
  datosContacto: Record<string, unknown>
  observaciones?: string | null
  createdAt: string
  updatedAt: string
  cliente: ClienteVenta
  totalBoletos: number
}

// Interface for sales list response
export interface VentasListResponse {
  data: Venta[]
  total: number
  page: number
  limit: number
  totalPages: number
  resumenFiltros: Record<string, unknown>
}

// Interface for sales search parameters
export interface VentasSearchParams {
  estadoPago?: 'PENDIENTE' | 'PAGADO' | 'EXPIRADO' | 'CANCELADO' | 'FALLIDO' | 'REEMBOLSADO'
  estadoVenta?: 'RESERVADO' | 'CONFIRMADO' | 'EXPIRADO' | 'CANCELADO' | 'ANULADO' | 'PENDIENTE_PAGO' | 'PAGO_APROBADO'
  estadoAsientos?: 'SIN_RESERVAR' | 'BLOQUEADO' | 'LIBERADO' | 'CONFIRMADO' | 'NO_DISPONIBLE'
  metodoPago?: 'BANCARD' | 'WHATSAPP' | 'TRANSFERENCIA' | 'EFECTIVO'
  empresaId?: string
  usuarioId?: string
  clienteId?: string
  origenId?: string
  destinoId?: string
  numeroTransaccion?: string
  nombreEmpresa?: string
  nombreEmpresaExterna?: string
  fechaVentaDesde?: string
  fechaVentaHasta?: string
  fechaViajeDesde?: string
  fechaViajeHasta?: string
  importeMinimo?: number
  importeMaximo?: number
  referenciaPago?: string
  bancardTransactionId?: string
  page?: number
  limit?: number
  sortBy?: 'fechaVenta' | 'fechaViaje' | 'importeTotal' | 'numeroTransaccion' | 'createdAt'
  sortOrder?: 'ASC' | 'DESC'
}
