import { useMutation } from '@tanstack/react-query'
import { confirmarVenta, type ConfirmarVentaRequest, type ConfirmarVentaResponse } from '../services/confirmar-venta'

export function useConfirmarVenta() {
  return useMutation<ConfirmarVentaResponse, Error, ConfirmarVentaRequest>({
    mutationFn: confirmarVenta,
    onSuccess: (data) => {
      // Verificar si hay errores en la respuesta
      if (data.fallidas > 0) {
        const errores = data.resultados
          .filter(resultado => !resultado.exitoso && resultado.error)
          .map(resultado => resultado.error!.mensaje)
          .join(', ')
        
        throw new Error(errores)
      }
    },
    onError: (error) => {
      // El error ya viene con el mensaje correcto del servidor
      throw error
    },
  })
}
