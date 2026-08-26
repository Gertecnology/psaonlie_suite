import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  actualizarEstadoPago,
  type ActualizarEstadoPagoRequest,
  type ActualizarEstadoPagoResponse,
} from '../services/actualizar-estado-pago'

/**
 * Marca la venta como pagada.
 *
 * El service lanza si el backend no confirma el cambio de estado, así que no
 * hace falta interpretar nada acá.
 */
export function useActualizarEstadoPago() {
  const queryClient = useQueryClient()

  return useMutation<
    ActualizarEstadoPagoResponse,
    Error,
    { ventaId: string; data: ActualizarEstadoPagoRequest }
  >({
    mutationFn: ({ ventaId, data }) => actualizarEstadoPago(ventaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] })
    },
  })
}
