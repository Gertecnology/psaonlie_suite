import { consultarAsientos } from '../services/sales.service'
import { useQuery } from '@tanstack/react-query'
import type { AsientosResponse, ConsultarAsientosRequest } from '../models/sales.model'

export function useGetAsientos(params: ConsultarAsientosRequest | null) {
    return useQuery<AsientosResponse>({
        queryKey: ['asientos', params],
        queryFn: () => consultarAsientos(params!),
        enabled: !!params && !!(params.servicioId && params.origenId && params.destinoId && params.empresaId),
        staleTime: 1 * 60 * 1000, // 1 minuto (datos muy dinámicos)
        gcTime: 2 * 60 * 1000, // 2 minutos
        retry: 1, // Solo reintentar 1 vez
    })
}
