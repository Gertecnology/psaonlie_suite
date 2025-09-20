const API_URL = import.meta.env.VITE_API_URL

export interface ActualizarEstadoPagoRequest {
  estadoPago: string
  observaciones?: string
  metodoPago: string
}

export interface ActualizarEstadoPagoResponse {
  ventaId: string
  numeroTransaccion: string
  estadoAnterior: string
  estadoNuevo: string
  fechaActualizacion: string
  mensaje: string
}

export async function actualizarEstadoPago(
  ventaId: string, 
  data: ActualizarEstadoPagoRequest
): Promise<ActualizarEstadoPagoResponse> {
  const response = await fetch(`${API_URL}/api/ventas/${ventaId}/actualizar-estado-pago`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`)
  }

  return response.json()
}
