import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bloquearAsientos } from '../services/sales.service'
import type {
  BloquearAsientosRequest,
  BloquearAsientosResponse,
} from '../models/sales.model'

/**
 * Bloquea asientos contra la empresa.
 *
 * El hook no interpreta el resultado: `bloquearAsientos` ya lanza cuando el
 * bloqueo falló o quedó incompleto. Antes este `onSuccess` logueaba "Asientos
 * bloqueados exitosamente" para cualquier respuesta 201, incluidas las que
 * traían `exitoso: false` — de ahí salían las ventas pagadas sin boleto.
 */
export function useBloquearAsientos() {
  const queryClient = useQueryClient()

  return useMutation<BloquearAsientosResponse, Error, BloquearAsientosRequest>({
    mutationFn: bloquearAsientos,
    // Un bloqueo cambia la disponibilidad real del servicio, tanto si sale
    // bien como si sale mal: refrescamos la taquilla en los dos casos.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['asientos'] })
    },
  })
}
