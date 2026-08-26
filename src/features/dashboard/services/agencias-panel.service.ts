import { aNumero } from '@/lib/formato'
import { apiFetch } from '@/utils/api-client'

/**
 * Empresas, vistas desde el panel de control.
 *
 * El CRUD vive en `features/agencias`; acá sólo se necesita el listado para el
 * selector y para la alerta de conectividad, así que se define un tipo mínimo
 * en vez de acoplar las dos features.
 *
 * A diferencia de `/api/admin/ventas/*`, este endpoint **sí** usa el envelope y
 * además pagina con la clave `items` (no `data`). `apiFetch` desenvuelve el
 * sobre; el `items` lo resolvemos acá.
 */
export interface EmpresaPanel {
  id: string
  nombre: string
  url: string | null
  activo: boolean
  ultimaSincronizacionSoap: string | null
  porcentajeVentas: number
}

/** Tope que impone `BaseQueryDto` en el backend (`@Max(100)`). */
export const LIMITE_MAXIMO_EMPRESAS = 100

function normalizarEmpresa(fila: Record<string, unknown>): EmpresaPanel {
  const url = typeof fila.url === 'string' ? fila.url.trim() : ''
  const sincronizacion = fila.ultimaSincronizacionSoap
  return {
    id: String(fila.id ?? ''),
    nombre: String(fila.nombre ?? 'Sin nombre'),
    url: url.length > 0 ? url : null,
    activo: fila.activo === true || fila.activo === 'true',
    ultimaSincronizacionSoap:
      typeof sincronizacion === 'string' && sincronizacion.length > 0
        ? sincronizacion
        : null,
    // `porcentaje_ventas` es `decimal`: llega como "2.50".
    porcentajeVentas: aNumero(fila.porcentajeVentas),
  }
}

/**
 * `GET /agencias` — sin prefijo `/api`, a diferencia del resto.
 *
 * Devuelve sólo las filas sin padre, que son las empresas: es exactamente lo
 * que el selector del panel necesita, porque una agencia hija no tiene
 * conexión propia y filtrar por ella sería filtrar por un pedazo de su empresa.
 *
 * Trae hasta 100 por página. Con ~20 empresas vivas alcanza una sola llamada;
 * si el padrón crece, el selector debería pasar a búsqueda server-side por
 * `nombre` (el backend ya la soporta).
 */
export async function obtenerAgencias(
  limite = LIMITE_MAXIMO_EMPRESAS
): Promise<EmpresaPanel[]> {
  const query = new URLSearchParams({
    page: '1',
    limit: String(Math.min(limite, LIMITE_MAXIMO_EMPRESAS)),
    sortBy: 'nombre',
    sortOrder: 'ASC',
  })

  const crudo = await apiFetch<{ items?: unknown[] }>(
    `/agencias?${query.toString()}`,
    { fallbackMessage: 'No se pudo obtener el listado de empresas.' }
  )

  const items = Array.isArray(crudo?.items) ? crudo.items : []
  return items
    .filter(
      (f): f is Record<string, unknown> => typeof f === 'object' && f !== null
    )
    .map(normalizarEmpresa)
}
