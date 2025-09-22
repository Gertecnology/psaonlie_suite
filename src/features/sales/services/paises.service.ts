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
  const url = empresaId 
    ? `https://api.pasajeonline.com.py/api/paises?empresaid=${empresaId}`
    : 'https://api.pasajeonline.com.py/api/paises'
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Error al obtener países: ${response.status}`)
  }

  return response.json()
}
