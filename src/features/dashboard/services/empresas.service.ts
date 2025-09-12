import { EmpresasListResponse, EmpresasSearchParams } from '../models/empresas.model'

const API_URL = import.meta.env.VITE_API_URL

/**
 * Service function to fetch empresas list
 * @param params - Search parameters (currently not used)
 * @returns Promise with empresas list response
 */
export async function getEmpresasList(params: EmpresasSearchParams = {}): Promise<EmpresasListResponse> {
  try {
    const url = new URL(`${API_URL}/empresas/lista`)
    
    // Add any search parameters if needed in the future
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value))
      }
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const data: EmpresasListResponse = await response.json()
    return data
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching empresas list:', error)
    throw error
  }
}
