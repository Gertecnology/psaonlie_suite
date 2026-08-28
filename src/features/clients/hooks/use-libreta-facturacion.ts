import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  guardarTitular,
  marcarPredeterminado,
  obtenerLibreta,
  quitarTitular,
  type TitularAGuardar,
} from '../services/facturacion.service'

const clave = (clienteId: string | undefined) => [
  'libreta-facturacion',
  clienteId,
]

/** Los titulares a nombre de quien el cliente factura. */
export function useLibretaFacturacion(clienteId: string | undefined) {
  return useQuery({
    queryKey: clave(clienteId),
    queryFn: () => obtenerLibreta(clienteId!),
    enabled: !!clienteId,
    staleTime: 60 * 1000,
  })
}

/**
 * Guarda un titular, nuevo o corregido.
 *
 * No distingue alta de edición porque el backend tampoco: busca por documento y
 * actualiza el que encuentre.
 */
export function useGuardarTitular(clienteId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (datos: TitularAGuardar) => guardarTitular(clienteId!, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clave(clienteId) })
      toast.success('Titular guardado', {
        description: 'Ya se le va a ofrecer al comprar.',
      })
    },
    onError: (error) => {
      toast.error('No se pudo guardar el titular', {
        description: error.message,
      })
    },
  })
}

export function useMarcarPredeterminado(clienteId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (titularId: string) =>
      marcarPredeterminado(clienteId!, titularId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clave(clienteId) })
      toast.success('Predeterminado actualizado', {
        description: 'Es el que se va a ofrecer primero al comprar.',
      })
    },
    onError: (error) => {
      toast.error('No se pudo marcar el predeterminado', {
        description: error.message,
      })
    },
  })
}

export function useQuitarTitular(clienteId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (titularId: string) => quitarTitular(clienteId!, titularId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clave(clienteId) })
      toast.success('Titular quitado', {
        description: 'Las facturas ya emitidas no cambian.',
      })
    },
    onError: (error) => {
      toast.error('No se pudo quitar el titular', {
        description: error.message,
      })
    },
  })
}
