import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateServiceCharge } from '../services/service-charge.service'
import { type ServiceChargeFormValues } from '../models/service-charge.model'

export function useUpdateServiceCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceChargeFormValues }) => updateServiceCharge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-charges'] })
      toast.success('Cargo por servicio actualizado', {
        description: 'El cargo por servicio se ha actualizado correctamente.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast.error('Error al actualizar', {
        description:
          error.message || 'Ha ocurrido un error al actualizar el cargo por servicio.',
        duration: 3000,
      })
    },
  })
}
