import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignServiceChargeToCompany } from '../services/service-charge.service'

interface AssignServiceChargeParams {
  empresaId: string
  serviceChargeId: string
}

export function useAssignServiceChargeToCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ empresaId, serviceChargeId }: AssignServiceChargeParams) =>
      assignServiceChargeToCompany(empresaId, serviceChargeId),
    onSuccess: () => {
      // Invalidar las queries relacionadas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['service-charges'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
