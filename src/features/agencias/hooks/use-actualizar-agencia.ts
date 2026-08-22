import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { actualizarAgencia } from '../services/agencia.service'
import { type AgenciaFormValues } from '../models/agencia.model'

export function useActualizarAgencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AgenciaFormValues }) =>
      actualizarAgencia(id, data),
    onSuccess: (_datos, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['agencias'] })
      queryClient.invalidateQueries({ queryKey: ['agencia', id] })
      toast.success('Agencia actualizada', {
        description: 'La agencia se ha actualizado correctamente.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast.error('Error al actualizar', {
        description:
          error.message || 'Ha ocurrido un error al actualizar la agencia.',
        duration: 3000,
      })
    },
  })
}
