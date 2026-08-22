/**
 * Tipos de `GET /api/admin/ventas/estadisticas`.
 *
 * Verificado el 21/08/2026 contra `admin-venta.service.ts:1643-1652` del
 * worktree `wt/informes`. La respuesta viene **sin envelope**: es el objeto
 * pelado (ver `apiFetch`).
 *
 * Advertencias del contrato real:
 * - `agruparPor` se acepta y se ignora: `obtenerEstadisticasTemporales` siempre
 *   agrupa por día.
 * - `periodo` usa las claves `fechaDesde`/`fechaHasta` acá, pero `desde`/`hasta`
 *   en `/dashboard`. No son intercambiables.
 * - `comparacion` devuelve `0` cuando el período anterior no tuvo ventas, que es
 *   indistinguible de "no varió". Por eso el panel calcula sus propias
 *   variaciones pidiendo el período anterior aparte (ver `use-comparativo`).
 */

export interface PeriodoEstadisticas {
  fechaDesde: string
  fechaHasta: string
}

/**
 * Totales del período.
 *
 * Los tres montos del negocio son distintos y no se suman entre sí:
 * - `montoTotal` / `montoCompletado` son el **pasaje** (`importeTotal`).
 * - `totalServiceCharges` es el **cargo por servicio**, que se le suma al cliente.
 * - `totalComisiones` es **nuestra comisión**, que se descuenta de lo que se le
 *   transfiere a la empresa. El cliente no la paga.
 */
export interface EstadisticasGenerales {
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
  comisionesPendientes: number

  totalServiceCharges: number
  serviceChargesPagados: number
  serviceChargesPendientes: number
  serviceChargePromedioPorVenta: number

  totalBoletos: number
  boletosPagados: number
  boletosPendientes: number

  tasaConversion: number
  montoPromedioPorVenta: number
  boletosPromedioPorVenta: number
}

export interface EstadisticasPorMetodoPago {
  metodoPago: string
  cantidad: number
  monto: number
  porcentaje: number
}

export interface EstadisticasPorAgencia {
  agenciaId: string
  empresaNombre: string
  cantidad: number
  monto: number
  montoPagado: number
  montoPendiente: number
  comisiones: number
  comisionesPagadas: number
  comisionesPendientes: number
  serviceCharges: number
  serviceChargesPagados: number
  serviceChargesPendientes: number
  porcentaje: number
}

export interface EstadisticasPorRuta {
  origenNombre: string
  destinoNombre: string
  cantidad: number
  monto: number
  porcentaje: number
}

export interface EstadisticasTemporales {
  fecha: string
  ventas: number
  monto: number
  ventasCompletadas: number
  montoCompletado: number
  serviceChargesTotal: number
}

export interface TopCliente {
  clienteId: string
  nombreCompleto: string
  email: string
  totalVentas: number
  montoTotal: number
}

export interface ComparacionBackend {
  ventasCrecimiento: number
  montoCrecimiento: number
  tasaConversionAnterior: number
  diferenciaTasaConversion: number
}

export interface EstadisticasVentas {
  periodo: PeriodoEstadisticas
  generales: EstadisticasGenerales
  porMetodoPago: EstadisticasPorMetodoPago[]
  porAgencia: EstadisticasPorAgencia[]
  porRuta: EstadisticasPorRuta[]
  temporales: EstadisticasTemporales[]
  topClientes: TopCliente[]
  comparacion: ComparacionBackend
}

/** Filtros que acepta el endpoint de estadísticas. */
export interface FiltrosEstadisticas {
  fechaDesde?: string
  fechaHasta?: string
  agenciaId?: string
}
