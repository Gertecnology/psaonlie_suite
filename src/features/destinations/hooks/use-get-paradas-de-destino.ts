import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  getParadasDeDestino,
  type ParadasDeDestinoParams,
} from '../services/destination.service'

/**
 * Las paradas de un destino, de a una página.
 *
 * `keepPreviousData` deja la tabla anterior en pantalla mientras llega la
 * siguiente: sin eso, cada tecla del buscador vacía la tabla y la lista salta.
 */
export function useGetParadasDeDestino(
  destinoId: string | undefined,
  params: ParadasDeDestinoParams,
) {
  return useQuery({
    queryKey: ['paradas-de-destino', destinoId, params],
    queryFn: () => getParadasDeDestino(destinoId!, params),
    enabled: !!destinoId,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}
