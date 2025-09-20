export interface AsientoVenta {
  Nroasiento: string
  Precio: number
  clienteId: string
}

export interface VentaConfirmar {
  bloqueoCodigoReferencia: string
  servicioId: string
  empresaId: string
  EmpresaBoleto: string
  calidad: string
  origenId: string
  destinoId: string
  metodoPago: string
  estadoPago: string
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
  empresaId: string
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
  estado: string
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
}

const API_URL = import.meta.env.VITE_API_URL

export async function confirmarVenta(data: ConfirmarVentaRequest): Promise<ConfirmarVentaResponse> {
  const response = await fetch(`${API_URL}/api/ventas/confirmar-nueva`, {
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
