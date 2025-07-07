import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { deleteCompany } from '../services/company.service'

export function useDeleteCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
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