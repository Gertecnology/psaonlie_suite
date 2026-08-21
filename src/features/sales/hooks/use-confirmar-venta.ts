import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  confirmarVenta,
  type ConfirmarVentaRequest,
  type ConfirmarVentaResponse,
} from '../services/confirmar-venta'

/**
 * Confirma la venta.
 *
 * No hay callbacks: `confirmarVenta` ya lanza `VentaConfirmacionError` cuando
 * alguna venta del lote falló. La versión anterior lanzaba desde `onSuccess` y
 * volvía a lanzar desde `onError`, dentro del observer de React Query, lo que
 * produce rejections sin manejar.
 */
export function useConfirmarVenta() {
  const queryClient = useQueryClient()

  return useMutation<ConfirmarVentaResponse, Error, ConfirmarVentaRequest>({
    mutationFn: confirmarVenta,
    onSettled: () => {
      // La venta consume el bloqueo y cambia la disponibilidad del servicio.
      queryClient.invalidateQueries({ queryKey: ['asientos'] })
    },
  })
}
