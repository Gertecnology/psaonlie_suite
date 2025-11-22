// Interface for statistics period
export interface StatisticsPeriod {
  fechaDesde: string
  fechaHasta: string
}

// Interface for general statistics
export interface GeneralStatistics {
  totalVentas: number
  ventasCompletadas: number
  ventasPendientes: number
  ventasCanceladas: number
  ventasExpiradas: number
  montoTotal: number
  montoCompletado: number
  montoPendiente: number
  totalComisiones: number
  comisionesPagadas: number
  totalServiceCharges: number
  serviceChargesPagados: number
  serviceChargePromedioPorVenta: number
  totalBoletos: number
  tasaConversion: number
  montoPromedioPorVenta: number
  boletosPromedioPorVenta: number
}

// Interface for payment method statistics
export interface PaymentMethodStatistics {
  metodoPago: string
  cantidad: number
  monto: number
  porcentaje: number
}

// Interface for company statistics
export interface CompanyStatistics {
  empresaId: string
  empresaNombre: string
  cantidad: number
  montoPagado: number
  comisiones: number
  serviceCharges: number
  porcentaje: number
}

// Interface for route statistics
export interface RouteStatistics {
  origenNombre: string
  destinoNombre: string
  cantidad: number
  monto: number
  porcentaje: number
}

// Interface for temporal statistics (daily data)
export interface TemporalStatistics {
  fecha: string
  ventas: number
  monto: number
  ventasCompletadas: number
  montoCompletado: number
  serviceChargesTotal: number
}

// Interface for top clients
export interface TopClient {
  nombreCompleto: string
  email: string
  totalVentas: number
  montoTotal: number
}

// Interface for comparison data
export interface ComparisonData {
  ventasCrecimiento: number
  montoCrecimiento: number
  tasaConversionAnterior: number
  diferenciaTasaConversion: number
}

// Main interface for complete statistics response
export interface SalesStatistics {
  periodo: StatisticsPeriod
  generales: GeneralStatistics
  porMetodoPago: PaymentMethodStatistics[]
  porEmpresa: CompanyStatistics[]
  porRuta: RouteStatistics[]
  temporales: TemporalStatistics[]
  topClientes: TopClient[]
  comparacion: ComparisonData
}

// Interface for statistics search parameters
export interface StatisticsSearchParams {
  fechaDesde?: string
  fechaHasta?: string
  empresaId?: string
  agruparPor?: string
}
