import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { crearAgencia } from '../services/agencia.service'
import { type CrearAgenciaFormValues } from '../models/agencia.model'

export function useCrearAgencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: CrearAgenciaFormValues) => crearAgencia(datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agencias'] })
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
