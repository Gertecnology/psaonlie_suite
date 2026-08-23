import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { assignServiceChargeToCompany } from '../services/service-charge.service'

interface AssignServiceChargeParams {
  agenciaId: string
  serviceChargeId: string
  /** Sólo para el mensaje: el endpoint no lo usa. */
  serviceChargeName: string
}

export function useAssignServiceChargeToCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ agenciaId, serviceChargeId }: AssignServiceChargeParams) =>
      assignServiceChargeToCompany(agenciaId, serviceChargeId),
    // Los avisos viven acá y no en el diálogo, como en el resto de las
    // mutaciones de la feature: así el error se muestra igual venga de donde
    // venga la llamada.
    onSuccess: (_data, { serviceChargeName }) => {
      queryClient.invalidateQueries({ queryKey: ['service-charges'] })
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Cargo asignado', {
        description: `El cargo «${serviceChargeName}» se asignó a la empresa correctamente.`,
      })
    },
    onError: (error) => {
      toast.error('Error al asignar', {
        description:
          error.message || 'Ha ocurrido un error al asignar el cargo por servicio.',
      })
    },
  })
}
