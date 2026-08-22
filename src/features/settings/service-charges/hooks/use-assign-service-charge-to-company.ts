import { useMutation, useQueryClient } from '@tanstack/react-query'
import { assignServiceChargeToCompany } from '../services/service-charge.service'

interface AssignServiceChargeParams {
  agenciaId: string
  serviceChargeId: string
}

export function useAssignServiceChargeToCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agenciaId, serviceChargeId }: AssignServiceChargeParams) =>
      assignServiceChargeToCompany(agenciaId, serviceChargeId),
    onSuccess: () => {
      // Invalidar las queries relacionadas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['service-charges'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
