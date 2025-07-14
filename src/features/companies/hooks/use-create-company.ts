import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { createCompany as createCompanyService } from '../services/company.service'
import { type CreateCompanyFormValues } from '../models/company.model'

export function useCreateCompany() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (companyData: CreateCompanyFormValues) =>
      createCompanyService(companyData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      toast.success('Empresa creada', {
        description: 'La empresa se ha creado correctamente.',
      })
    },
    onError: (error) => {
      toast.error('Error al crear', {
        description:
          error.message || 'Ha ocurrido un error al crear la empresa.',
      })
    },
  })
} 