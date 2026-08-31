import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  guardarTiemposDeReserva,
  leerTiemposDeReserva,
  type TiemposDeReserva,
} from './tiempos-de-reserva.service'

const CLAVE = ['tiempos-de-reserva'] as const

export function useTiemposDeReserva() {
  return useQuery({
    queryKey: CLAVE,
    queryFn: leerTiemposDeReserva,
    staleTime: 5 * 60 * 1000,
  })
}

export function useGuardarTiemposDeReserva() {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: (tiempos: TiemposDeReserva) => guardarTiemposDeReserva(tiempos),
    onSuccess: (resultado) => {
      // Se escribe la respuesta y no lo enviado: el margen pudo recortarse
      // contra el bloqueo de alguna empresa, y la pantalla tiene que mostrar
      // lo que quedó de verdad.
      cliente.setQueryData(CLAVE, resultado)
      toast.success('Tiempos guardados')
    },
    onError: (problema: Error) => {
      toast.error('No se pudieron guardar', { description: problema.message })
    },
  })
}
