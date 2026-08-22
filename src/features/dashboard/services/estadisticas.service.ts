import { aNumero } from '@/lib/formato'
import { apiFetch } from '@/utils/api-client'
import type {
  EstadisticasGenerales,
  EstadisticasPorAgencia,
  EstadisticasPorMetodoPago,
  EstadisticasPorRuta,
  EstadisticasTemporales,
  EstadisticasVentas,
  FiltrosEstadisticas,
  TopCliente,
} from '../models/estadisticas.model'

/**
 * Normaliza a número todos los campos numéricos de la respuesta.
 *
 * No es paranoia: las columnas `decimal`/`numeric` de Postgres y los `COUNT(*)`
 * vuelven como **string** aunque los DTO del backend los declaren `number`
 * (`porcentajeVentas` llega como `"2.50"`). Sumar dos de esos con `+` concatena
 * en vez de sumar, y `Math.max` sobre strings ordena alfabéticamente.
 *
 * Se normaliza una sola vez, acá, en el borde de la red. De ahí para adentro
 * los tipos declarados son ciertos.
 */
function normalizarGenerales(crudo: unknown): EstadisticasGenerales {
  const g = (crudo ?? {}) as Record<string, unknown>
  return {
    totalVentas: aNumero(g.totalVentas),
    ventasCompletadas: aNumero(g.ventasCompletadas),
    ventasPendientes: aNumero(g.ventasPendientes),
    ventasCanceladas: aNumero(g.ventasCanceladas),
    ventasExpiradas: aNumero(g.ventasExpiradas),

    montoTotal: aNumero(g.montoTotal),
    montoCompletado: aNumero(g.montoCompletado),
    montoPendiente: aNumero(g.montoPendiente),

    totalComisiones: aNumero(g.totalComisiones),
    comisionesPagadas: aNumero(g.comisionesPagadas),
    comisionesPendientes: aNumero(g.comisionesPendientes),

    totalServiceCharges: aNumero(g.totalServiceCharges),
    serviceChargesPagados: aNumero(g.serviceChargesPagados),
    serviceChargesPendientes: aNumero(g.serviceChargesPendientes),
    serviceChargePromedioPorVenta: aNumero(g.serviceChargePromedioPorVenta),

    totalBoletos: aNumero(g.totalBoletos),
    boletosPagados: aNumero(g.boletosPagados),
    boletosPendientes: aNumero(g.boletosPendientes),

    tasaConversion: aNumero(g.tasaConversion),
    montoPromedioPorVenta: aNumero(g.montoPromedioPorVenta),
    boletosPromedioPorVenta: aNumero(g.boletosPromedioPorVenta),
  }
}

function normalizarLista<T>(
  crudo: unknown,
  mapear: (fila: Record<string, unknown>) => T
): T[] {
  if (!Array.isArray(crudo)) return []
  return crudo
    .filter(
      (fila): fila is Record<string, unknown> =>
        typeof fila === 'object' && fila !== null
    )
    .map(mapear)
}

function normalizarMetodoPago(
  fila: Record<string, unknown>
): EstadisticasPorMetodoPago {
  return {
    metodoPago: String(fila.metodoPago ?? 'DESCONOCIDO'),
    cantidad: aNumero(fila.cantidad),
    monto: aNumero(fila.monto),
    porcentaje: aNumero(fila.porcentaje),
  }
}

function normalizarAgencia(
  fila: Record<string, unknown>
): EstadisticasPorAgencia {
  return {
    agenciaId: String(fila.agenciaId ?? ''),
    empresaNombre: String(fila.empresaNombre ?? 'Sin nombre'),
    cantidad: aNumero(fila.cantidad),
    monto: aNumero(fila.monto),
    montoPagado: aNumero(fila.montoPagado),
    montoPendiente: aNumero(fila.montoPendiente),
    comisiones: aNumero(fila.comisiones),
    comisionesPagadas: aNumero(fila.comisionesPagadas),
    comisionesPendientes: aNumero(fila.comisionesPendientes),
    serviceCharges: aNumero(fila.serviceCharges),
    serviceChargesPagados: aNumero(fila.serviceChargesPagados),
    serviceChargesPendientes: aNumero(fila.serviceChargesPendientes),
    porcentaje: aNumero(fila.porcentaje),
  }
}

function normalizarRuta(fila: Record<string, unknown>): EstadisticasPorRuta {
  return {
    origenNombre: String(fila.origenNombre ?? 'N/A'),
    destinoNombre: String(fila.destinoNombre ?? 'N/A'),
    cantidad: aNumero(fila.cantidad),
    monto: aNumero(fila.monto),
    porcentaje: aNumero(fila.porcentaje),
  }
}

function normalizarTemporal(
  fila: Record<string, unknown>
): EstadisticasTemporales {
  return {
    fecha: String(fila.fecha ?? ''),
    ventas: aNumero(fila.ventas),
    monto: aNumero(fila.monto),
    ventasCompletadas: aNumero(fila.ventasCompletadas),
    montoCompletado: aNumero(fila.montoCompletado),
    serviceChargesTotal: aNumero(fila.serviceChargesTotal),
  }
}

function normalizarTopCliente(fila: Record<string, unknown>): TopCliente {
  return {
    clienteId: String(fila.clienteId ?? ''),
    nombreCompleto: String(fila.nombreCompleto ?? 'Sin nombre'),
    email: String(fila.email ?? ''),
    totalVentas: aNumero(fila.totalVentas),
    montoTotal: aNumero(fila.montoTotal),
  }
}

/** Convierte la respuesta cruda del backend en `EstadisticasVentas` confiable. */
export function normalizarEstadisticas(crudo: unknown): EstadisticasVentas {
  const r = (crudo ?? {}) as Record<string, unknown>
  const periodo = (r.periodo ?? {}) as Record<string, unknown>
  const comparacion = (r.comparacion ?? {}) as Record<string, unknown>

  return {
    periodo: {
      fechaDesde: String(periodo.fechaDesde ?? ''),
      fechaHasta: String(periodo.fechaHasta ?? ''),
    },
    generales: normalizarGenerales(r.generales),
    porMetodoPago: normalizarLista(r.porMetodoPago, normalizarMetodoPago),
    porAgencia: normalizarLista(r.porAgencia, normalizarAgencia),
    porRuta: normalizarLista(r.porRuta, normalizarRuta),
    temporales: normalizarLista(r.temporales, normalizarTemporal),
    topClientes: normalizarLista(r.topClientes, normalizarTopCliente),
    comparacion: {
      ventasCrecimiento: aNumero(comparacion.ventasCrecimiento),
      montoCrecimiento: aNumero(comparacion.montoCrecimiento),
      tasaConversionAnterior: aNumero(comparacion.tasaConversionAnterior),
      diferenciaTasaConversion: aNumero(comparacion.diferenciaTasaConversion),
    },
  }
}

/**
 * `GET /api/admin/ventas/estadisticas`.
 *
 * Todos los filtros los resuelve el servidor. El panel nunca recorta ni suma
 * del lado del cliente lo que el backend ya calculó sobre el conjunto completo.
 */
export async function obtenerEstadisticas(
  filtros: FiltrosEstadisticas
): Promise<EstadisticasVentas> {
  const query = new URLSearchParams()
  if (filtros.fechaDesde) query.append('fechaDesde', filtros.fechaDesde)
  if (filtros.fechaHasta) query.append('fechaHasta', filtros.fechaHasta)
  if (filtros.agenciaId) query.append('agenciaId', filtros.agenciaId)

  const crudo = await apiFetch<unknown>(
    `/api/admin/ventas/estadisticas?${query.toString()}`,
    { fallbackMessage: 'No se pudieron obtener las estadísticas de ventas.' }
  )

  return normalizarEstadisticas(crudo)
}
