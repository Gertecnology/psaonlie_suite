import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createDestination } from '../services/destination.service'
import { DestinationFormValues } from '../models/destination.model'
import { toast } from 'sonner'

export function useCreateDestination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: DestinationFormValues) => createDestination(data),
    onSuccess: () => {
      // Invalidar y refetch la lista de destinos
      queryClient.invalidateQueries({ queryKey: ['destinations'] })
      toast.success('Destino creado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear destino: ${error.message}`)
    },
  })
}
