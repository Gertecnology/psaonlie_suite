import { useQuery } from '@tanstack/react-query'
import { getTiposDocumentoByEmpresa } from '../services/tipos-documento.service'

export function useTiposDocumentoByEmpresa(agenciaId: string | undefined) {
  return useQuery({
    queryKey: ['tipos-documento', agenciaId],
    queryFn: () => getTiposDocumentoByEmpresa(agenciaId!),
    enabled: !!agenciaId, // Solo ejecutar si hay agenciaId
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
    refetchOnWindowFocus: false,
  })
}
