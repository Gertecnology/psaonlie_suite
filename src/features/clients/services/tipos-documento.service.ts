import { apiFetchRaw } from '@/utils/api-client'

export interface TipoDocumento {
  id: string
  idExterno: number
  codigo: string
  descripcion: string
  activo: boolean
  ordenVisualizacion: number
}

export async function getTiposDocumentoByEmpresa(
  empresaId: string,
): Promise<TipoDocumento[]> {
  const tipos = await apiFetchRaw<TipoDocumento[]>(
    `/api/clientes/empresas/${encodeURIComponent(empresaId)}/tipos-documento`,
    { fallbackMessage: 'Error al obtener los tipos de documento' },
  )

  return tipos ?? []
}
