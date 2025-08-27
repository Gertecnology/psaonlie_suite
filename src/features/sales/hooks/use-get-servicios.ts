import { getServiciosPorDestinos, type EmpresaServicios, type ServiciosSearchParams } from '../services/sales.service'
import { useQuery } from '@tanstack/react-query'

export function useGetServicios(params: ServiciosSearchParams) {
    return useQuery<EmpresaServicios[]>({
        queryKey: ['servicios-por-destinos', params],
        queryFn: () => getServiciosPorDestinos(params),
        enabled: !!(params.origenDestinoId && params.destinoDestinoId && params.fecha),
        staleTime: 2 * 60 * 1000, // 2 minutos (datos más dinámicos)
        gcTime: 5 * 60 * 1000, // 5 minutos
        retry: 2, // Reintentar 2 veces en caso de error
    })
}
