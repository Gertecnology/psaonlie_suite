// Tipos para los filtros de exportación de ventas
export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'EXPIRADO' | 'CANCELADO' | 'FALLIDO' | 'REEMBOLSADO'
export type EstadoVenta = 'RESERVADO' | 'CONFIRMADO' | 'EXPIRADO' | 'CANCELADO' | 'ANULADO' | 'PENDIENTE_PAGO' | 'PAGO_APROBADO'
export type EstadoAsientos = 'SIN_RESERVAR' | 'BLOQUEADO' | 'LIBERADO' | 'CONFIRMADO' | 'NO_DISPONIBLE'
export type MetodoPago = 'BANCARD' | 'WHATSAPP' | 'TRANSFERENCIA' | 'EFECTIVO'
export type FormatoExportacion = 'csv' | 'xlsx'
export type SortBy = 'fechaVenta' | 'fechaViaje' | 'importeTotal' | 'numeroTransaccion' | 'createdAt'
export type SortOrder = 'ASC' | 'DESC'

// Interface para los filtros de exportación
export interface ExportFilters {
  // Filtros de estado
  estadoPago?: EstadoPago
  estadoVenta?: EstadoVenta
  estadoAsientos?: EstadoAsientos
  metodoPago?: MetodoPago
  
  // Filtros de IDs
  empresaId?: string
  usuarioId?: string
  clienteId?: string
  origenId?: string
  destinoId?: string
  
  // Filtros de texto
  numeroTransaccion?: string
  nombreEmpresa?: string
  nombreEmpresaExterna?: string
  referenciaPago?: string
  bancardTransactionId?: string
  
  // Filtros de fecha
  fechaVentaDesde?: string
  fechaVentaHasta?: string
  fechaViajeDesde?: string
  fechaViajeHasta?: string
  
  // Filtros de importe
  importeMinimo?: number
  importeMaximo?: number
  
  // Ordenamiento
  sortBy?: SortBy
  sortOrder?: SortOrder
  
  // Formato de exportación
  formato?: FormatoExportacion
}

// Opciones para los selects
export const ESTADO_PAGO_OPTIONS = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PAGADO', label: 'Pagado' },
  { value: 'EXPIRADO', label: 'Expirado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'FALLIDO', label: 'Fallido' },
  { value: 'REEMBOLSADO', label: 'Reembolsado' },
] as const

export const ESTADO_VENTA_OPTIONS = [
  { value: 'RESERVADO', label: 'Reservado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'EXPIRADO', label: 'Expirado' },
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'ANULADO', label: 'Anulado' },
  { value: 'PENDIENTE_PAGO', label: 'Pendiente Pago' },
  { value: 'PAGO_APROBADO', label: 'Pago Aprobado' },
] as const

export const ESTADO_ASIENTOS_OPTIONS = [
  { value: 'SIN_RESERVAR', label: 'Sin Reservar' },
  { value: 'BLOQUEADO', label: 'Bloqueado' },
  { value: 'LIBERADO', label: 'Liberado' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'NO_DISPONIBLE', label: 'No Disponible' },
] as const

export const METODO_PAGO_OPTIONS = [
  { value: 'BANCARD', label: 'Bancard' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'TRANSFERENCIA', label: 'Transferencia' },
  { value: 'EFECTIVO', label: 'Efectivo' },
] as const

export const FORMATO_OPTIONS = [
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'csv', label: 'CSV' },
] as const

export const SORT_BY_OPTIONS = [
  { value: 'fechaVenta', label: 'Fecha de Venta' },
  { value: 'fechaViaje', label: 'Fecha de Viaje' },
  { value: 'importeTotal', label: 'Importe Total' },
  { value: 'numeroTransaccion', label: 'Número de Transacción' },
  { value: 'createdAt', label: 'Fecha de Creación' },
] as const

export const SORT_ORDER_OPTIONS = [
  { value: 'ASC', label: 'Ascendente' },
  { value: 'DESC', label: 'Descendente' },
] as const
