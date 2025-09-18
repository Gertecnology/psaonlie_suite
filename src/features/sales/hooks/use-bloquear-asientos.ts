/* eslint-disable no-console */
import { bloquearAsientos } from '../services/sales.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BloquearAsientosRequest, BloquearAsientosResponse } from '../models/sales.model'

export function useBloquearAsientos() {
  const queryClient = useQueryClient()

  return useMutation<BloquearAsientosResponse, Error, BloquearAsientosRequest>({
    mutationFn: bloquearAsientos,
    onSuccess: (data) => {
      // Invalidar la consulta de asientos para refrescar la disponibilidad
      queryClient.invalidateQueries({ queryKey: ['asientos'] })
      
      // Opcional: mostrar notificación de éxito
      console.log('Asientos bloqueados exitosamente:', data)
    },
    onError: (error) => {
      console.error('Error al bloquear asientos:', error)
    },
  })
}
