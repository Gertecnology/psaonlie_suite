import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  getServiceCharges,
  type ObtenerServiceChargesParams,
} from '../services/service-charge.service'

/**
 * Paged list of service charges, with every filter resolved by the server.
 *
 * All the parameters are part of the `queryKey`: otherwise React Query would
 * hand back the page it already had cached and the filter would look like it
 * did nothing.
 */
export function useGetServiceCharges(params: ObtenerServiceChargesParams) {
  return useQuery({
    queryKey: ['service-charges', params],
    queryFn: () => getServiceCharges(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    // Mantiene la página anterior mientras llega la nueva: la tabla se atenúa
    // en vez de vaciarse en cada tecla del buscador.
    placeholderData: keepPreviousData,
  })
}
