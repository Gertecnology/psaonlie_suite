import axios from "axios"

export interface Parada {
  id: string
  idExterno: number
  descripcion: string
  empresaNombre: string
  empresaId: string
}

export interface Pasaje {
  id: string
  origen: string
  destino: string
  fechaSalida: string
  fechaLlegada: string
  horaSalida: string
  horaLlegada: string
  duracion: string
  empresa: string
  tipoServicio: string
  precio: number
  moneda: string
  asientosDisponibles: number
}

export async function searchParadas(searchTerm: string): Promise<Parada[]> {
  if (!searchTerm || searchTerm.length < 2) return []

  try {
    const response = await axios.get(`/api/search-paradas?searchTerm=${searchTerm}`)
    return Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.error("Error:", error)
    return []
  }
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    await axios.get("/api/search-paradas?searchTerm=test")
    return true
  } catch {
    return false
  }
}
