import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateCompanyLogo } from '../services/company.service'

export function useUpdateCompanyLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, profileImage }: { id: string; profileImage: File }) => 
      updateCompanyLogo(id, profileImage),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Logo actualizado', {
        description: data.message || 'El logo de la empresa se ha actualizado correctamente.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast.error('Error al actualizar logo', {
        description: error.message || 'Ha ocurrido un error al actualizar el logo de la empresa.',
        duration: 3000,
      })
    },
  })
}
