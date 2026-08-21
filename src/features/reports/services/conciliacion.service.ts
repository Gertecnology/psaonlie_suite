import { aNumero } from '@/lib/formato'
import { apiFetch } from '@/utils/api-client'

/**
 * Conciliación de pagos: `GET /api/pagos/estadisticas/resumen`.
 *
 * ── Por qué este service lee las claves sin distinguir mayúsculas ──
 *
 * Las consultas del backend usan alias SQL sin comillas
 * (`COUNT(*) as totalTransacciones`). Postgres pliega esos alias a minúsculas,
 * así que `getRawOne()` devuelve `totaltransacciones`, `montoaprobado`,
 * `promediominutospago`… El backend después hace
 * `estadisticas.totalTransacciones > 0 ? … : 0` sobre la clave camelCase, que
 * no existe. Resultado en producción: `tasaExito: 0`,
 * `montoTotalProcesado: 0` y `totalTransacciones: null`, con Gs 13.398.550
 * reales detrás de esos ceros.
 *
 * Los datos crudos SÍ llegan, en las claves en minúsculas. Leyendo con
 * `leerNumero`, que prueba las dos grafías, el informe muestra los números
 * reales hoy y sigue andando igual cuando el backend corrija los alias.
 *
 * PENDIENTE DE AJUSTE (backend): entrecomillar los alias
 * (`as "totalTransacciones"`) o mapear explícitamente. Cuando pase, esta
 * tolerancia deja de hacer falta pero no molesta.
 */

/** Busca una clave probando su grafía exacta y su versión en minúsculas. */
function leerNumero(objeto: unknown, ...claves: string[]): number {
  if (!objeto || typeof objeto !== 'object') return 0
  const registro = objeto as Record<string, unknown>

  for (const clave of claves) {
    if (registro[clave] !== undefined && registro[clave] !== null) {
      return aNumero(registro[clave])
    }
    const minuscula = clave.toLowerCase()
    if (registro[minuscula] !== undefined && registro[minuscula] !== null) {
      return aNumero(registro[minuscula])
    }
  }
  return 0
}

export interface EstadisticasBancard {
  totalTransacciones: number
  aprobadas: number
  rechazadas: number
  canceladas: number
  expiradas: number
  montoAprobado: number
  promedioMinutosPago: number
  tasaExito: number
}

export interface EstadisticasPagosManuales {
  totalComprobantes: number
  aprobados: number
  rechazados: number
  pendientes: number
  promedioHorasVerificacion: number
  tasaAprobacion: number
}

export interface EstadisticasPagos {
  bancard: EstadisticasBancard
  manuales: EstadisticasPagosManuales
}

function normalizarBancard(crudo: unknown): EstadisticasBancard {
  const totalTransacciones = leerNumero(crudo, 'totalTransacciones')
  const aprobadas = leerNumero(crudo, 'aprobadas')

  return {
    totalTransacciones,
    aprobadas,
    rechazadas: leerNumero(crudo, 'rechazadas'),
    canceladas: leerNumero(crudo, 'canceladas'),
    expiradas: leerNumero(crudo, 'expiradas'),
    montoAprobado: leerNumero(crudo, 'montoAprobado'),
    promedioMinutosPago: leerNumero(crudo, 'promedioMinutosPago'),
    // Se recalcula acá en vez de confiar en el `tasaExito` del backend, que
    // hoy es siempre 0 por el mismo problema de mayúsculas.
    tasaExito:
      totalTransacciones > 0 ? (aprobadas / totalTransacciones) * 100 : 0,
  }
}

function normalizarManuales(crudo: unknown): EstadisticasPagosManuales {
  const totalComprobantes = leerNumero(crudo, 'totalComprobantes')
  const aprobados = leerNumero(crudo, 'aprobados')

  return {
    totalComprobantes,
    aprobados,
    rechazados: leerNumero(crudo, 'rechazados'),
    pendientes: leerNumero(crudo, 'pendientes'),
    promedioHorasVerificacion: leerNumero(crudo, 'promedioHorasVerificacion'),
    tasaAprobacion:
      totalComprobantes > 0 ? (aprobados / totalComprobantes) * 100 : 0,
  }
}

export async function obtenerEstadisticasPagos(filtros: {
  fechaDesde: string
  fechaHasta: string
}): Promise<EstadisticasPagos> {
  const query = new URLSearchParams({
    fechaDesde: filtros.fechaDesde,
    fechaHasta: filtros.fechaHasta,
  })

  const crudo = await apiFetch<Record<string, unknown>>(
    `/api/pagos/estadisticas/resumen?${query.toString()}`,
    { fallbackMessage: 'No se pudieron obtener las estadísticas de pagos.' },
  )

  return {
    bancard: normalizarBancard(crudo?.bancard),
    // Sí: la clave del backend está mal escrita ("pagosManules"). Se contempla
    // la grafía correcta por si algún día se corrige.
    manuales: normalizarManuales(crudo?.pagosManules ?? crudo?.pagosManuales),
  }
}
