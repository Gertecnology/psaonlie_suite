import { useMutation, useQueryClient } from '@tanstack/react-query'
import { liberarBloqueo } from '../services/sales.service'
import type { LiberarBloqueoResponse } from '../models/sales.model'

/**
 * Libera un bloqueo de asientos.
 *
 * `liberarBloqueo` lanza si el backend no confirma la liberación; el hook sólo
 * refresca la taquilla. Antes reportaba éxito por consola pasara lo que pasara.
 */
export function useLiberarBloqueo() {
  const queryClient = useQueryClient()

  return useMutation<LiberarBloqueoResponse, Error, string>({
    mutationFn: (codigoReferencia: string) => liberarBloqueo(codigoReferencia),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['asientos'] })
    },
  })
}
