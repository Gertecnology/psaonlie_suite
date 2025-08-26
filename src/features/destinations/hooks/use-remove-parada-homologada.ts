import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeParadaHomologada } from '../services/destination.service'
import { toast } from 'sonner'

interface RemoveParadaParams {
  destinationId: string
  paradaId: string
}

export function useRemoveParadaHomologada() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ destinationId, paradaId }: RemoveParadaParams) => 
      removeParadaHomologada(destinationId, paradaId),
    onSuccess: (_, { destinationId }) => {
      // Invalidar queries específicos
      queryClient.invalidateQueries({ queryKey: ['destination', destinationId] })
      queryClient.invalidateQueries({ queryKey: ['destinations'] })
      toast.success('Parada removida exitosamente del destino')
    },
    onError: (error: Error) => {
      toast.error(`Error al remover parada: ${error.message}`)
    },
  })
}
