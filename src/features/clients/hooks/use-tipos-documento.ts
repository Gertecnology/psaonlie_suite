import { useQuery } from '@tanstack/react-query'
import { getTiposDocumentoByEmpresa } from '../services/tipos-documento.service'

export function useTiposDocumentoByEmpresa(empresaId: string | undefined) {
  return useQuery({
    queryKey: ['tipos-documento', empresaId],
    queryFn: () => getTiposDocumentoByEmpresa(empresaId!),
    enabled: !!empresaId, // Solo ejecutar si hay empresaId
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    retry: 2,
    refetchOnWindowFocus: false,
  })
}
