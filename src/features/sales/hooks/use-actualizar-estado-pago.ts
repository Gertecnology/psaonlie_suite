/* eslint-disable no-console */
import { useMutation } from '@tanstack/react-query'
import { actualizarEstadoPago, type ActualizarEstadoPagoRequest, type ActualizarEstadoPagoResponse } from '../services/actualizar-estado-pago'

export function useActualizarEstadoPago() {
  return useMutation<ActualizarEstadoPagoResponse, Error, { ventaId: string; data: ActualizarEstadoPagoRequest }>({
    mutationFn: ({ ventaId, data }) => actualizarEstadoPago(ventaId, data),
    onSuccess: (data) => {
      console.log('Estado de pago actualizado exitosamente:', data)
    },
    onError: (error) => {
      console.error('Error al actualizar estado de pago:', error)
    },
  })
}
