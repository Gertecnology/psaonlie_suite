import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { actualizarLogoAgencia } from '../services/agencia.service'

export function useActualizarLogoAgencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, profileImage }: { id: string; profileImage: File }) =>
      actualizarLogoAgencia(id, profileImage),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['agencias'] })
      queryClient.invalidateQueries({ queryKey: ['agencia', id] })
      toast.success('Logo actualizado', {
        description:
          data.message || 'El logo de la agencia se ha actualizado correctamente.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast.error('Error al actualizar logo', {
        description:
          error.message ||
          'Ha ocurrido un error al actualizar el logo de la agencia.',
        duration: 3000,
      })
    },
  })
}
