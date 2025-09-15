export interface TipoDocumento {
  id: string
  idExterno: number
  codigo: string
  descripcion: string
  activo: boolean
  ordenVisualizacion: number
}

export async function getTiposDocumentoByEmpresa(empresaId: string): Promise<TipoDocumento[]> {
  const API_URL = import.meta.env.VITE_API_URL
  
  const response = await fetch(`${API_URL}/api/clientes/empresas/${empresaId}/tipos-documento`)
  
  if (!response.ok) {
    throw new Error('Error al obtener los tipos de documento')
  }

  return response.json()
}
