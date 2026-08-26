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
  agenciaId: string,
): Promise<TipoDocumento[]> {
  const tipos = await apiFetchRaw<TipoDocumento[]>(
    `/api/clientes/agencias/${encodeURIComponent(agenciaId)}/tipos-documento`,
    { fallbackMessage: 'Error al obtener los tipos de documento' },
  )

  return tipos ?? []
}
