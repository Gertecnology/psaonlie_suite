import { Destination, DestinationFormValues } from '../models/destination.model'

const API_URL = import.meta.env.VITE_API_URL

export async function getDestinations(params?: Record<string, string>): Promise<{ items: Destination[]; total: number; page: number; limit: number; totalPages: number }> {
  const token = localStorage.getItem('token')
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  const response = await fetch(`${API_URL}/destinos${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Error al obtener destinos')
  const result = await response.json()
  return result.data
}

export async function createDestination(data: DestinationFormValues): Promise<Destination> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/destinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Error al crear destino')
  return (await response.json()).data
}

export async function updateDestination(id: string, data: DestinationFormValues): Promise<Destination> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/destinos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Error al actualizar destino')
  return (await response.json()).data
}

export async function deleteDestination(id: string): Promise<void> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/destinos/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Error al eliminar destino')
}

// Servicio para obtener paradas homologadas para el selector múltiple
export async function getParadasHomologadasSelector(): Promise<{ id: string; descripcion: string }[]> {
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/paradas-homologadas`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) throw new Error('Error al obtener paradas homologadas')
  const result = await response.json()
  // Ajusta el mapeo según la respuesta real de tu API
  return result.data.items.map((p: { id: string; descripcion: string }) => ({ id: p.id, descripcion: p.descripcion }))
} 