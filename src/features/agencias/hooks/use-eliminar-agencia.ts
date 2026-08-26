import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { eliminarAgencia } from '../services/agencia.service'

export function useEliminarAgencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => eliminarAgencia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencias'] })
      toast.success('Empresa eliminada', {
        description: 'La empresa se ha eliminado correctamente.',
      })
    },
    onError: (error) => {
      toast.error('Error al eliminar', {
        description:
          error.message || 'Ha ocurrido un error al eliminar la empresa.',
      })
    },
  })
}
