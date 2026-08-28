import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  obtenerHijasPaginadas,
  type HijasDeEmpresaParams,
} from '../services/agencia.service'

/**
 * Las agencias de una empresa, de a una página.
 *
 * `keepPreviousData` deja la tabla anterior mientras llega la siguiente: sin
 * eso, cada tecla del buscador la vacía y la lista salta.
 */
export function useHijasPaginadas(
  padreId: string | undefined,
  params: HijasDeEmpresaParams,
) {
  return useQuery({
    queryKey: ['hijas-paginadas', padreId, params],
    queryFn: () => obtenerHijasPaginadas(padreId!, params),
    enabled: !!padreId,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}
