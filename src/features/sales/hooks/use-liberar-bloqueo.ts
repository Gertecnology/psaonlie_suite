/* eslint-disable no-console */
import { liberarBloqueo } from '../services/sales.service'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { LiberarBloqueoResponse } from '../models/sales.model'

export function useLiberarBloqueo() {
  const queryClient = useQueryClient()

  return useMutation<LiberarBloqueoResponse, Error, string>({
    mutationFn: liberarBloqueo,
    onSuccess: (data) => {
      // Invalidar la consulta de asientos para refrescar la disponibilidad
      queryClient.invalidateQueries({ queryKey: ['asientos'] })
      
      // Opcional: mostrar notificación de éxito
      console.log('Bloqueo liberado exitosamente:', data)
    },
    onError: (error) => {
      console.error('Error al liberar bloqueo:', error)
    },
  })
}
