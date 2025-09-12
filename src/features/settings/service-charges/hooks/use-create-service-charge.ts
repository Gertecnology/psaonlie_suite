import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createServiceCharge as createServiceChargeService } from '../services/service-charge.service'
import { type CreateServiceChargeFormValues } from '../models/service-charge.model'

export function useCreateServiceCharge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (serviceChargeData: CreateServiceChargeFormValues) =>
      createServiceChargeService(serviceChargeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-charges'] })
      toast.success('Cargo por servicio creado', {
        description: 'El cargo por servicio se ha creado correctamente.',
      })
    },
    onError: (error) => {
      toast.error('Error al crear', {
        description:
          error.message || 'Ha ocurrido un error al crear el cargo por servicio.',
      })
    },
  })
}
