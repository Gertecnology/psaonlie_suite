import type { FiltrosVentas } from '../models/ventas.model'
import { useVentas } from './use-ventas'

/**
 * Adaptador del hook viejo de listado de ventas.
 *
 * Lo consume `features/clients` (historial de compras de un cliente). Se
 * conserva el nombre y la firma para no tocar esa feature, pero por dentro
 * delega en `useVentas`, así hay **un solo** camino de red hacia
 * `/api/admin/ventas/lista`: el que adjunta el token, normaliza los `decimal`
 * que Postgres devuelve como string, y levanta el mensaje real del backend
 * cuando algo falla.
 *
 * La versión anterior hacía `fetch` crudo y decidía sólo con `response.ok`.
 */
export function useVentasList(
  params: FiltrosVentas = {},
  options: { enabled?: boolean } = {}
) {
  return useVentas(params, options)
}
