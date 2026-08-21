import { apiFetchRaw } from '@/utils/api-client'

const TIMEOUT_PAISES_MS = 45_000

export interface PaisData {
  diffgr_id: string
  rowOrder: string
  id: string
  Codigo: string
  Descripcion: string
}

export interface PaisEmpresa {
  empresa: string
  data: PaisData[]
  success: boolean
  error?: string
  url: string
  id: string
}

export type PaisesResponse = Array<PaisEmpresa>

export async function getPaises(empresaId?: string): Promise<PaisesResponse> {
  const path = empresaId
    ? `/api/paises?empresaid=${encodeURIComponent(empresaId)}`
    : '/api/paises'

  const paises = await apiFetchRaw<PaisesResponse>(path, {
    headers: { accept: 'application/json' },
    fallbackMessage: 'Error al obtener países',
    timeoutMs: TIMEOUT_PAISES_MS,
  })

  return paises ?? []
}
