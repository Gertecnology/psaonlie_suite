import { apiFetchRaw } from '@/utils/api-client'

/**
 * Pasar la venta a PAGADO dispara la emisión del boleto contra la empresa.
 * Es una llamada SOAP: necesita margen.
 */
const TIMEOUT_ACTUALIZAR_PAGO_MS = 120_000

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

/**
 * Marca la venta como pagada.
 *
 * El endpoint exige JWT (`JwtAuthGuard` + roles) y devuelve el objeto sin
 * envelope, por eso va con `apiFetchRaw`.
 */
export async function actualizarEstadoPago(
  ventaId: string,
  data: ActualizarEstadoPagoRequest,
): Promise<ActualizarEstadoPagoResponse> {
  const respuesta = await apiFetchRaw<ActualizarEstadoPagoResponse>(
    `/api/ventas/${encodeURIComponent(ventaId)}/actualizar-estado-pago`,
    {
      method: 'POST',
      body: JSON.stringify(data),
      fallbackMessage: 'No se pudo actualizar el estado de pago.',
      timeoutMs: TIMEOUT_ACTUALIZAR_PAGO_MS,
    },
  )

  // Sin cuerpo no hay confirmación de que el estado haya cambiado: no lo
  // damos por bueno, porque de ese "éxito" depende que se emita el boleto.
  if (!respuesta || !respuesta.estadoNuevo) {
    throw new Error(
      'El servidor no confirmó el cambio de estado. Verificá la venta en el listado antes de reintentar.',
    )
  }

  return respuesta
}
