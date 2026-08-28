import { apiFetchRaw } from '@/utils/api-client'

/**
 * La confirmación dispara la emisión del boleto contra el web service de la
 * empresa. Es la llamada más lenta de todo el flujo.
 */
const TIMEOUT_CONFIRMAR_MS = 120_000

export interface AsientoVenta {
  Nroasiento: string
  Precio: number
  clienteId: string
}

export interface VentaConfirmar {
  bloqueoCodigoReferencia: string
  servicioId: string
  agenciaId: string
  EmpresaBoleto: string
  calidad: string
  origenId: string
  destinoId: string
  /** Con qué se cobra. Opcional: se elige en el paso de cobro. */
  metodoPago?: string
  /** Sin método declarado la venta nace PENDIENTE. */
  estadoPago?: string
  /**
   * Importe de los pasajes, sin cargo por servicio ni comisión.
   * El backend calcula el cargo por servicio y la comisión a partir de esto.
   */
  importeTotal: number
  asiento: AsientoVenta[]
}

export interface ConfirmarVentaRequest {
  facturaClienteId?: string
  ventas: VentaConfirmar[]
}

export interface ErrorDetalle {
  bloqueoCodigoReferencia: string
  servicioId: string
  agenciaId: string
  stack: string
}

export interface ErrorResultado {
  codigo: string
  mensaje: string
  detalles: ErrorDetalle
}

export interface VentaExitosa {
  ventaId: string
  numeroTransaccion: string
  numeroBoleto: string
  /** El de la VENTA: CONFIRMADO o CANCELADO. No es el del pago. */
  estado: string
  /** `PAGADO` cuando nació cobrada, que es lo que pasa en efectivo. */
  estadoPago?: string
  /** Con qué se cobró. Se eligió al vender: el paso de cobro sólo lo muestra. */
  metodoPago?: string
  mensaje: string
  fechaCreacion: string
  boletos: unknown[]
  comisionTotal: number
}

export interface ResultadoVenta {
  indice: number
  exitoso: boolean
  error?: ErrorResultado
  venta?: VentaExitosa
}

export interface ConfirmarVentaResponse {
  esVentaIndividual: boolean
  totalProcesadas: number
  exitosas: number
  fallidas: number
  tiempoProcesamiento: number
  resultados: ResultadoVenta[]
  resumenErrores?: Record<string, number>
}

/**
 * Al menos una de las ventas del lote no se pudo confirmar.
 *
 * El endpoint responde HTTP 201 aunque todas las ventas hayan fallado: el
 * detalle viene por venta en `resultados[].exitoso`. Este error lleva la
 * respuesta completa para que la pantalla pueda distinguir el fallo total del
 * parcial y liberar los bloqueos que quedaron sin venta.
 */
export class VentaConfirmacionError extends Error {
  readonly respuesta: ConfirmarVentaResponse
  readonly codigos: string[]

  constructor(message: string, respuesta: ConfirmarVentaResponse) {
    super(message)
    this.name = 'VentaConfirmacionError'
    this.respuesta = respuesta
    this.codigos = respuesta.resultados
      .filter((resultado) => !resultado.exitoso && resultado.error)
      .map((resultado) => resultado.error!.codigo)
  }

  /** Ventas que sí se confirmaron, cuando el fallo fue parcial. */
  get ventasExitosas(): VentaExitosa[] {
    return this.respuesta.resultados
      .filter((resultado) => resultado.exitoso && resultado.venta)
      .map((resultado) => resultado.venta!)
  }

  /** Índices (0-based) de las ventas del lote que fallaron. */
  get indicesFallidos(): number[] {
    return this.respuesta.resultados
      .filter((resultado) => !resultado.exitoso)
      .map((resultado) => resultado.indice)
  }
}

/** Junta los mensajes de error de todas las ventas fallidas del lote. */
function describirFallos(respuesta: ConfirmarVentaResponse): string {
  const mensajes = respuesta.resultados
    .filter((resultado) => !resultado.exitoso)
    .map(
      (resultado) =>
        resultado.error?.mensaje || 'Error desconocido al confirmar la venta',
    )

  const unicos = [...new Set(mensajes)]
  return unicos.length > 0
    ? unicos.join(' · ')
    : 'La venta no se pudo confirmar.'
}

/**
 * Confirma una o varias ventas.
 *
 * Lanza `VentaConfirmacionError` cuando alguna venta del lote falló, para que
 * el éxito nunca se dé por supuesto. La detección vivía antes en el `onSuccess`
 * del hook, que además relanzaba el error dentro del `onError` del observer de
 * React Query: eso generaba rejections sin manejar en cuanto el backend
 * empezara a devolver 400/409.
 */
export async function confirmarVenta(
  data: ConfirmarVentaRequest,
): Promise<ConfirmarVentaResponse> {
  const respuesta = await apiFetchRaw<ConfirmarVentaResponse>(
    '/api/ventas/confirmar-nueva',
    {
      method: 'POST',
      body: JSON.stringify(data),
      fallbackMessage: 'No se pudo confirmar la venta.',
      timeoutMs: TIMEOUT_CONFIRMAR_MS,
    },
  )

  if (!respuesta || !Array.isArray(respuesta.resultados)) {
    throw new Error(
      'El servidor no devolvió el resultado de la venta. Verificá en el listado de ventas antes de reintentar.',
    )
  }

  if (respuesta.fallidas > 0 || respuesta.exitosas === 0) {
    throw new VentaConfirmacionError(describirFallos(respuesta), respuesta)
  }

  return respuesta
}

/**
 * Traduce un fallo de confirmación a un mensaje accionable para el operador.
 *
 * El backend clasifica los errores en `resultados[].error.codigo`
 * (`VentaService.clasificarError`). La validación del precio contra la tarifa
 * real cae en VALIDATION_ERROR: en ese caso el precio que tenemos en pantalla
 * quedó viejo y hay que volver a buscar el servicio.
 */
export function mensajeParaOperador(error: unknown): string {
  if (error instanceof VentaConfirmacionError) {
    const detalle = error.message

    if (error.codigos.includes('VALIDATION_ERROR')) {
      return `El servidor rechazó el precio de la venta: ${detalle}. Volvé a buscar el servicio para tomar la tarifa vigente.`
    }
    if (error.codigos.includes('BLOQUEO_ERROR')) {
      return `El bloqueo de asientos ya no es válido: ${detalle}. Volvé a seleccionar los asientos.`
    }
    if (error.codigos.includes('DISPONIBILIDAD_ERROR')) {
      return `Los asientos dejaron de estar disponibles: ${detalle}. Elegí otros asientos.`
    }
    if (error.codigos.includes('TIMEOUT_ERROR')) {
      return `La empresa no respondió a tiempo: ${detalle}. Verificá en el listado de ventas antes de reintentar.`
    }
    if (error.codigos.includes('API_EXTERNA_ERROR')) {
      return `El sistema de la empresa rechazó la venta: ${detalle}.`
    }

    return detalle
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Error desconocido al confirmar la venta.'
}
