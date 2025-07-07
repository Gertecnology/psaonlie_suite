import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateCompany } from '../services/company.service'
import { type CompanyFormValues } from '../models/company.model'

export function useUpdateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CompanyFormValues }) => updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Empresa actualizada', {
        description: 'La empresa se ha actualizado correctamente.',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast.error('Error al actualizar', {
        description:
          error.message || 'Ha ocurrido un error al actualizar la empresa.',
        duration: 3000,
      })
    },
  })
} 