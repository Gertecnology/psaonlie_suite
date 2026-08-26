import { aNumero } from '@/lib/formato'
import { apiDownload, apiFetch, descargarBlob } from '@/utils/api-client'
import type {
  FiltrosVentas,
  FormatoExportacion,
  RespuestaVentasLista,
  ResumenFiltros,
  VentaLista,
} from '../models/ventas.model'

/** Arma el query string omitiendo los filtros vacíos. */
export function construirQueryVentas(filtros: FiltrosVentas): URLSearchParams {
  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor === undefined || valor === null || valor === '') continue
    query.append(clave, String(valor))
  }
  return query
}

function normalizarVenta(fila: Record<string, unknown>): VentaLista {
  return {
    ...(fila as unknown as VentaLista),
    // Los `decimal` de Postgres pueden llegar como string según la ruta.
    importeTotal: aNumero(fila.importeTotal),
    comisionTotal: aNumero(fila.comisionTotal),
    serviceChargeMontoTotal: aNumero(fila.serviceChargeMontoTotal),
    totalBoletos: aNumero(fila.totalBoletos),
    asientosOriginales: Array.isArray(fila.asientosOriginales)
      ? (fila.asientosOriginales as string[])
      : [],
    numerosBoleto:
      typeof fila.numerosBoleto === 'string' ? fila.numerosBoleto : '',
  }
}

function normalizarConteos<T extends string>(
  crudo: unknown
): Partial<Record<T, number>> {
  if (!crudo || typeof crudo !== 'object') return {}
  const salida: Partial<Record<T, number>> = {}
  for (const [clave, valor] of Object.entries(crudo)) {
    salida[clave as T] = aNumero(valor)
  }
  return salida
}

function normalizarResumen(crudo: unknown): ResumenFiltros {
  const r = (crudo ?? {}) as Record<string, unknown>
  return {
    totalImporte: aNumero(r.totalImporte),
    totalComision: aNumero(r.totalComision),
    totalServiceCharge: aNumero(r.totalServiceCharge),
    estadosPago: normalizarConteos(r.estadosPago),
    estadosVenta: normalizarConteos(r.estadosVenta),
    metodosPago: normalizarConteos(r.metodosPago),
  }
}

/**
 * `GET /api/admin/ventas/lista`.
 *
 * `resumenFiltros` viene calculado por el backend sobre **todo** el conjunto
 * filtrado, no sobre la página: por eso los totales que muestra el panel son
 * correctos aunque en pantalla haya 10 filas.
 */
export async function obtenerVentas(
  filtros: FiltrosVentas = {}
): Promise<RespuestaVentasLista> {
  const query = construirQueryVentas(filtros)

  const crudo = await apiFetch<Record<string, unknown>>(
    `/api/admin/ventas/lista?${query.toString()}`,
    { fallbackMessage: 'No se pudo obtener el listado de ventas.' }
  )

  const filas = Array.isArray(crudo?.data) ? crudo.data : []

  return {
    data: filas
      .filter(
        (f): f is Record<string, unknown> => typeof f === 'object' && f !== null
      )
      .map(normalizarVenta),
    total: aNumero(crudo?.total),
    page: aNumero(crudo?.page) || 1,
    limit: aNumero(crudo?.limit) || filas.length,
    totalPages: aNumero(crudo?.totalPages),
    resumenFiltros: normalizarResumen(crudo?.resumenFiltros),
  }
}

/**
 * `GET /api/admin/ventas/exportar` — descarga el conjunto filtrado completo.
 *
 * El backend exporta **sin paginar**, así que el archivo refleja exactamente
 * los mismos filtros que la pantalla. `page` y `limit` se descartan porque el
 * endpoint no los acepta.
 */
export async function exportarVentas(
  filtros: FiltrosVentas,
  formato: FormatoExportacion = 'xlsx'
): Promise<void> {
  const { page: _page, limit: _limit, ...resto } = filtros
  const query = construirQueryVentas(resto)
  query.append('formato', formato)

  const { blob, nombreArchivo } = await apiDownload(
    `/api/admin/ventas/exportar?${query.toString()}`,
    { fallbackMessage: 'No se pudo generar la exportación de ventas.' }
  )

  const marca = new Date().toISOString().slice(0, 10)
  descargarBlob(blob, nombreArchivo ?? `ventas-${marca}.${formato}`)
}
