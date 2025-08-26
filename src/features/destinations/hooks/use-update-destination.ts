import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateDestination } from '../services/destination.service'
import { DestinationFormValues } from '../models/destination.model'
import { toast } from 'sonner'

export function useUpdateDestination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DestinationFormValues }) =>
      updateDestination(id, data),
    onSuccess: (_, { id }) => {
      // Invalidar queries específicos
      queryClient.invalidateQueries({ queryKey: ['destinations'] })
      queryClient.invalidateQueries({ queryKey: ['destination', id] })
      toast.success('Destino actualizado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar destino: ${error.message}`)
    },
  })
}
