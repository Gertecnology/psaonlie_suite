import { searchParadasHomologadas, type ParadaHomologada } from '../services/sales.service'
import { useQuery } from '@tanstack/react-query'

export function useGetParadasHomologadas(searchTerm: string) {
    return useQuery<ParadaHomologada[]>({
        queryKey: ['paradas-homologadas', searchTerm],
        queryFn: () => searchParadasHomologadas(searchTerm),
        enabled: !!searchTerm && searchTerm.trim().length > 0,
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
    })
}