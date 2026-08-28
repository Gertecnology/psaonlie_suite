import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { ClientesSearchParams } from '../models/clients.model'
import {
  getClientesList,
  getClientePorEmail,
} from '../services/clients.service'

export function useClientesList(params: ClientesSearchParams) {
  return useQuery({
    queryKey: ['clientes-list', params],
    queryFn: () => getClientesList(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: 2,
    refetchOnWindowFocus: false,
    // Sin esto, cada tecla del buscador vacía la tabla y la deja en esqueleto.
    // Con la página anterior en pantalla, la tabla sólo se atenúa mientras
    // llega la nueva.
    placeholderData: keepPreviousData,
  })
}

/**
 * El backend identifica al cliente por email (`GET /api/clientes/:email`),
 * no por id.
 */
export function useClientePorEmail(email: string) {
  return useQuery({
    queryKey: ['cliente', email],
    queryFn: () => getClientePorEmail(email),
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  })
}

/**
 * El cliente junto con sus estadísticas de compras.
 *
 * `GET /api/clientes/:email` devuelve la persona sola: los totales de compras
 * viven únicamente en el listado. Éste lo consulta filtrado por email y se
 * queda con la coincidencia exacta — el backend filtra por coincidencia
 * parcial, así que `datos[0]` podría ser otro cliente cuyo email contenga al
 * buscado.
 */
export function useClienteConEstadisticas(email: string) {
  return useQuery({
    queryKey: ['cliente-con-estadisticas', email],
    queryFn: async () => {
      const respuesta = await getClientesList({
        page: 1,
        limit: 5,
        email,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      })

      return (
        respuesta.data.find(
          (fila) =>
            fila.cliente.email.toLowerCase() === email.trim().toLowerCase()
        ) ?? null
      )
    },
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  })
}
