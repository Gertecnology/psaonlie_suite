import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteServiceCharge } from '../services/service-charge.service'

export function useDeleteServiceCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteServiceCharge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-charges'] })
      toast.success('Cargo por servicio eliminado', {
        description: 'El cargo por servicio se ha eliminado correctamente.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast.error('Error al eliminar', {
        description:
          error.message || 'Ha ocurrido un error al eliminar el cargo por servicio.',
        duration: 3000,
      })
    },
  })
}
