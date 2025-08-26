import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteDestination } from '../services/destination.service'
import { toast } from 'sonner'

export function useDeleteDestination() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteDestination(id),
    onSuccess: () => {
      // Invalidar la lista de destinos
      queryClient.invalidateQueries({ queryKey: ['destinations'] })
      toast.success('Destino eliminado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar destino: ${error.message}`)
    },
  })
}
