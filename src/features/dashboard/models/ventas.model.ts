/**
 * Tipos de `GET /api/admin/ventas/lista`.
 *
 * Verificado el 21/08/2026 contra `admin-venta.service.ts` (`mapearVentaLista`,
 * `calcularResumenFiltros`) del worktree `wt/informes`. Viene **sin envelope**.
 */

export const ESTADOS_PAGO = [
  'PENDIENTE',
  'PAGADO',
  'EXPIRADO',
  'CANCELADO',
  'FALLIDO',
  'REEMBOLSADO',
] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

export const ESTADOS_VENTA = [
  'RESERVADO',
  'CONFIRMADO',
  'EXPIRADO',
  'CANCELADO',
  'ANULADO',
  'PENDIENTE_PAGO',
  'PAGO_APROBADO',
] as const
export type EstadoVenta = (typeof ESTADOS_VENTA)[number]

export const ESTADOS_ASIENTOS = [
  'SIN_RESERVAR',
  'BLOQUEADO',
  'LIBERADO',
  'CONFIRMADO',
  'NO_DISPONIBLE',
] as const
export type EstadoAsientos = (typeof ESTADOS_ASIENTOS)[number]

// Los métodos de pago viven en `lib/` porque también los usan las pantallas de
// cobro, que no son parte del dashboard. Se reexportan acá para que el resto
// del modelo de ventas se siga leyendo de corrido.
export {
  METODOS_PAGO,
  ETIQUETAS_METODO_PAGO,
  METODOS_PAGO_MANUAL,
  OPCIONES_METODO_PAGO,
  type MetodoPago,
} from '@/lib/metodo-pago'

export const ETIQUETAS_ESTADO_PAGO: Record<EstadoPago, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  EXPIRADO: 'Expirado',
  CANCELADO: 'Cancelado',
  FALLIDO: 'Fallido',
  REEMBOLSADO: 'Reembolsado',
}

export const ETIQUETAS_ESTADO_VENTA: Record<EstadoVenta, string> = {
  RESERVADO: 'Reservado',
  CONFIRMADO: 'Confirmado',
  EXPIRADO: 'Expirado',
  CANCELADO: 'Cancelado',
  ANULADO: 'Anulado',
  PENDIENTE_PAGO: 'Pendiente de pago',
  PAGO_APROBADO: 'Pago aprobado',
}

export interface ClienteDeVenta {
  id: string
  tipoDocumento: string
  numeroDocumento: string
  nombre: string
  apellido: string
  telefono: string
  email: string
  nacionalidad: string
}

/**
 * Una fila del listado.
 *
 * Los campos numéricos están declarados como `number` porque el mapper del
 * backend les hace `parseFloat`. Aun así, todo lo que se calcula pasa por
 * `aNumero`: los `decimal` de Postgres cambian de forma según qué ruta del
 * backend los tocó, y confiar en la declaración del DTO ya falló antes.
 */
export interface VentaLista {
  id: string
  numeroTransaccion: string
  agenciaId: string
  empresaNombre: string
  usuarioId: string | null
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
  porcentajeComisionSnapshot?: number
  serviceChargeIdSnapshot?: string
  serviceChargeNombreSnapshot?: string
  serviceChargeTipoSnapshot?: string
  serviceChargePorcentajeSnapshot?: number
  serviceChargeMontoFijoSnapshot?: number
  serviceChargeMontoTotal: number

  metodoPago: MetodoPago
  estadoPago: EstadoPago
  estadoVenta: EstadoVenta
  estadoAsientos: EstadoAsientos

  fechaExpiracionPago: string | null
  referenciaPago: string | null
  bancardTransactionId: string | null
  datosContacto: Record<string, unknown>
  observaciones: string | null
  createdAt: string
  updatedAt: string

  cliente?: ClienteDeVenta
  /** Boletos efectivamente emitidos. `0` en una venta PAGADA es el problema. */
  totalBoletos: number
  /** Números separados por coma y espacio: `"123, 124"`. No es un array. */
  numerosBoleto: string
}

/**
 * Totales calculados por el backend sobre **todo** el conjunto filtrado, no
 * sobre la página. Es lo que permite mostrar sumas correctas sin traer las
 * miles de filas que las componen.
 */
export interface ResumenFiltros {
  totalImporte: number
  totalComision: number
  totalServiceCharge: number
  estadosPago: Partial<Record<EstadoPago, number>>
  estadosVenta: Partial<Record<EstadoVenta, number>>
  metodosPago: Partial<Record<MetodoPago, number>>
}

export interface RespuestaVentasLista {
  data: VentaLista[]
  total: number
  page: number
  limit: number
  totalPages: number
  resumenFiltros: ResumenFiltros
}

/** Campos por los que el backend acepta ordenar. */
export const CAMPOS_ORDEN_VENTAS = [
  'fechaVenta',
  'fechaViaje',
  'importeTotal',
  'numeroTransaccion',
  'createdAt',
] as const
export type CampoOrdenVentas = (typeof CAMPOS_ORDEN_VENTAS)[number]

/**
 * Filtros de `/lista` y `/exportar`.
 *
 * `sortBy` está acotado a la lista de arriba porque el backend lo interpola
 * crudo en `orderBy(\`venta.${sortBy}\`)` con sólo `@IsString()`: un valor
 * inesperado es un 500, y la superficie tiene forma de inyección.
 */
export interface FiltrosVentas {
  estadoPago?: EstadoPago
  estadoVenta?: EstadoVenta
  estadoAsientos?: EstadoAsientos
  metodoPago?: MetodoPago
  agenciaId?: string
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
  sortBy?: CampoOrdenVentas
  sortOrder?: 'ASC' | 'DESC'
}

/** Formatos que acepta `GET /api/admin/ventas/exportar`. */
export const FORMATOS_EXPORTACION = ['xlsx', 'csv'] as const
export type FormatoExportacion = (typeof FORMATOS_EXPORTACION)[number]
