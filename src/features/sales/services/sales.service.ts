import { apiFetchRaw } from '@/utils/api-client'
import { asientosFaltantes } from '../utils/asientos'
// Import de sólo tipos: no genera dependencia en runtime pese al ciclo con el
// modelo, que a su vez re-exporta los tipos de este archivo.
import type { AsientosResponse } from '../models/sales.model'

/** Tiempo que le damos al SOAP de las empresas para responder una búsqueda. */
const TIMEOUT_CONSULTA_MS = 45_000

/**
 * El bloqueo consulta la taquilla, bloquea contra la empresa y vuelve a
 * consultar para verificar. Son tres viajes SOAP encadenados, por eso el
 * margen es mayor que el de una consulta simple.
 */
const TIMEOUT_BLOQUEO_MS = 90_000

// Interface for homologated stop response
export interface ParadaHomologada {
  id: string
  nombre: string
}

// Interface for individual service
export interface Servicio {
  diffgr_id: string
  rowOrder: string
  Id: string
  Emp: string
  Cod: string
  Embarque: string
  Libres: string
  Calidad: string
  Tarifa: string
  Desembarque: string
  fechaembarque: string
  Fec: string
  TextoTarifas: string
  TextoTarifasFull: string
}

/**
 * Cargo por servicio configurado para la empresa.
 *
 * Los campos numéricos llegan como string desde Postgres (columnas `decimal`),
 * por eso el tipo los acepta en las dos formas. Usar siempre los helpers de
 * `utils/money` para operar con ellos.
 */
export interface ServiceCharge {
  id: string
  nombre: string
  porcentaje: string | number
  activo: boolean
  esGlobal: boolean
  /** Valores reales del backend: 'PORCENTUAL' | 'FIJO'. */
  tipoAplicacion: string
  montoFijo?: string | number | null
  montoMinimo?: string | number | null
  montoMaximo?: string | number | null
}

// Interface for company services response
export interface EmpresaServicios {
  empresa: string
  data: Servicio[]
  success: boolean
  /** URL del logo de la empresa que arma el backend. */
  url?: string
  id: string
  porcentajeVenta?: number
  serviceCharge?: ServiceCharge
}

// Interface for search parameters
export interface ServiciosSearchParams {
  origenDestinoId: string
  destinoDestinoId: string
  fecha: string
  horaDesde?: string
  horaHasta?: string
  calidad?: 'CO' | 'SC' | 'CN' | 'SE'
  tarifaMinima?: number
  tarifaMaxima?: number
  asientosMinimos?: number
  empresaId?: string
  ordenarPor?: 'embarque' | 'tarifa' | 'libres' | 'calidad'
  ordenDireccion?: 'asc' | 'desc'
}

/** Respuesta cruda del endpoint de bloqueo. */
export interface BloquearAsientosApiResponse {
  exitoso: boolean
  codigoReferencia: string
  nroConexion: string
  tiempoExpiracion: string
  asientosBloqueados: string[]
  asientosNoDisponibles: string[]
  mensaje: string
}

/** Respuesta cruda del endpoint de liberación. */
export interface LiberarBloqueoApiResponse {
  success: boolean
  message: string
}

/**
 * El bloqueo de asientos falló, total o parcialmente.
 *
 * Existe porque el backend responde HTTP 201 aunque no haya bloqueado nada:
 * el resultado real viene en el cuerpo (`exitoso`, `asientosBloqueados`). Sin
 * este error el panel avanzaba al checkout con asientos que nunca se
 * reservaron, el cliente pagaba y el boleto no se podía emitir.
 */
export class BloqueoAsientosError extends Error {
  readonly asientosNoBloqueados: string[]
  readonly codigoReferencia: string
  readonly parcial: boolean

  constructor(
    message: string,
    opciones: {
      asientosNoBloqueados?: string[]
      codigoReferencia?: string
      parcial?: boolean
    } = {},
  ) {
    super(message)
    this.name = 'BloqueoAsientosError'
    this.asientosNoBloqueados = opciones.asientosNoBloqueados ?? []
    this.codigoReferencia = opciones.codigoReferencia ?? ''
    this.parcial = opciones.parcial ?? false
  }
}

// Service to search homologated stops by name
export async function searchParadasHomologadas(
  searchTerm: string,
): Promise<ParadaHomologada[]> {
  if (!searchTerm.trim()) {
    throw new Error('El término de búsqueda es requerido')
  }

  return apiFetchRaw<ParadaHomologada[]>(
    `/api/search-paradas-homologadas?searchTerm=${encodeURIComponent(searchTerm)}`,
    {
      fallbackMessage: 'Error al buscar paradas homologadas',
      timeoutMs: TIMEOUT_CONSULTA_MS,
    },
  )
}

// Service to get services by destinations with filters
export async function getServiciosPorDestinos(
  params: ServiciosSearchParams,
): Promise<EmpresaServicios[]> {
  const {
    origenDestinoId,
    destinoDestinoId,
    fecha,
    horaDesde,
    horaHasta,
    calidad,
    tarifaMinima,
    tarifaMaxima,
    asientosMinimos,
    empresaId,
    ordenarPor,
    ordenDireccion,
  } = params

  if (!origenDestinoId || !destinoDestinoId || !fecha) {
    throw new Error(
      'Los parámetros origenDestinoId, destinoDestinoId y fecha son requeridos',
    )
  }

  const queryParams = new URLSearchParams({
    origenDestinoId,
    destinoDestinoId,
    fecha,
  })

  if (horaDesde) queryParams.append('horaDesde', horaDesde)
  if (horaHasta) queryParams.append('horaHasta', horaHasta)
  if (calidad) queryParams.append('calidad', calidad)
  if (tarifaMinima !== undefined)
    queryParams.append('tarifaMinima', tarifaMinima.toString())
  if (tarifaMaxima !== undefined)
    queryParams.append('tarifaMaxima', tarifaMaxima.toString())
  if (asientosMinimos !== undefined)
    queryParams.append('asientosMinimos', asientosMinimos.toString())
  if (empresaId) queryParams.append('empresaId', empresaId)
  if (ordenarPor) queryParams.append('ordenarPor', ordenarPor)
  if (ordenDireccion) queryParams.append('ordenDireccion', ordenDireccion)

  const servicios = await apiFetchRaw<EmpresaServicios[]>(
    `/api/servicios-por-destinos?${queryParams.toString()}`,
    {
      fallbackMessage: 'Error al obtener servicios por destinos',
      timeoutMs: TIMEOUT_CONSULTA_MS,
    },
  )

  return servicios ?? []
}

// Service to consult available seats for a service
export async function consultarAsientos(params: {
  servicioId: string
  origenId: string
  destinoId: string
  empresaId: string
}) {
  const { servicioId, origenId, destinoId, empresaId } = params

  if (!servicioId || !origenId || !destinoId || !empresaId) {
    throw new Error(
      'Todos los parámetros son requeridos: servicioId, origenId, destinoId, empresaId',
    )
  }

  const respuesta = await apiFetchRaw<AsientosResponse>(
    '/api/ventas/consultar-asientos',
    {
      method: 'POST',
      body: JSON.stringify({ servicioId, origenId, destinoId, empresaId }),
      fallbackMessage: 'Error al consultar asientos disponibles',
      timeoutMs: TIMEOUT_CONSULTA_MS,
    },
  )

  if (!respuesta || !Array.isArray(respuesta.asientos)) {
    throw new Error(
      'La empresa no devolvió el mapa de asientos. Reintentá en unos segundos.',
    )
  }

  return respuesta
}

/**
 * Bloquea asientos por 30 minutos y **verifica el resultado real**.
 *
 * El endpoint responde 201 en todos los casos, incluso cuando no bloqueó nada:
 * el veredicto está en el cuerpo. Peor todavía, `exitoso` es `true` cuando se
 * bloqueó *al menos uno* de los asientos pedidos, así que un bloqueo parcial
 * pasaba como éxito completo y la venta se confirmaba por asientos que nunca
 * quedaron reservados.
 *
 * Acá se rechaza cualquier resultado que no cubra exactamente lo pedido, y se
 * libera el bloqueo parcial para no dejar asientos colgados 30 minutos.
 */
export async function bloquearAsientos(params: {
  servicioId: string
  origenId: string
  destinoId: string
  asientos: string[]
  empresaId: string
}): Promise<BloquearAsientosApiResponse> {
  const { servicioId, origenId, destinoId, asientos, empresaId } = params

  if (!servicioId || !origenId || !destinoId || !empresaId) {
    throw new BloqueoAsientosError(
      'Faltan datos del servicio para bloquear los asientos.',
    )
  }

  if (!asientos || asientos.length === 0) {
    throw new BloqueoAsientosError(
      'Debe seleccionar al menos un asiento para bloquear.',
    )
  }

  const resultado = await apiFetchRaw<BloquearAsientosApiResponse>(
    '/api/ventas/bloquear-asientos',
    {
      method: 'POST',
      body: JSON.stringify({
        servicioId,
        origenId,
        destinoId,
        asientos,
        empresaId,
      }),
      fallbackMessage: 'No se pudieron bloquear los asientos.',
      timeoutMs: TIMEOUT_BLOQUEO_MS,
    },
  )

  if (!resultado) {
    throw new BloqueoAsientosError(
      'El servidor no devolvió el resultado del bloqueo. No se reservó ningún asiento.',
      { asientosNoBloqueados: asientos },
    )
  }

  const bloqueados = resultado.asientosBloqueados ?? []

  // Fallo declarado por el backend, o bloqueo sin código: no hay reserva.
  if (!resultado.exitoso || !resultado.codigoReferencia || bloqueados.length === 0) {
    throw new BloqueoAsientosError(
      resultado.mensaje ||
        'No se pudo bloquear ningún asiento. Elegí otros asientos o reintentá.',
      {
        asientosNoBloqueados:
          resultado.asientosNoDisponibles?.length
            ? resultado.asientosNoDisponibles
            : asientos,
        codigoReferencia: resultado.codigoReferencia ?? '',
      },
    )
  }

  // Bloqueo parcial: el backend lo reporta como éxito. Para nosotros no lo es.
  const faltantes = asientosFaltantes(asientos, bloqueados)
  if (faltantes.length > 0) {
    // El bloqueo parcial ya existe del lado de la empresa: liberarlo para que
    // los asientos no queden retenidos media hora por una venta que no será.
    await liberarBloqueo(resultado.codigoReferencia).catch(() => undefined)

    throw new BloqueoAsientosError(
      `Solo se pudieron bloquear ${bloqueados.length} de ${asientos.length} asientos. No quedaron disponibles: ${faltantes.join(', ')}. Se liberó la reserva parcial.`,
      {
        asientosNoBloqueados: faltantes,
        codigoReferencia: resultado.codigoReferencia,
        parcial: true,
      },
    )
  }

  return resultado
}

/**
 * Libera un bloqueo por su código de referencia.
 *
 * `keepalive` permite que la request sobreviva al cierre de la pestaña: es lo
 * que usamos para liberar los asientos cuando el operador abandona la venta.
 */
export async function liberarBloqueo(
  codigoReferencia: string,
  opciones: { keepalive?: boolean } = {},
): Promise<LiberarBloqueoApiResponse> {
  if (!codigoReferencia) {
    throw new Error('El código de referencia es requerido')
  }

  const resultado = await apiFetchRaw<LiberarBloqueoApiResponse>(
    `/api/ventas/liberar-bloqueo/${encodeURIComponent(codigoReferencia)}`,
    {
      method: 'POST',
      keepalive: opciones.keepalive,
      fallbackMessage: 'Error al liberar el bloqueo de asientos',
      timeoutMs: TIMEOUT_CONSULTA_MS,
    },
  )

  if (resultado && resultado.success === false) {
    throw new Error(
      resultado.message || 'No se pudo liberar el bloqueo de asientos.',
    )
  }

  return resultado ?? { success: true, message: 'Bloqueo liberado' }
}
