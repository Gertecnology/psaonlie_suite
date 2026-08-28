import { apiFetch } from '@/utils/api-client'
import {
  type Agencia,
  type AgenciasPaginadasResponse,
  type AgenciaFormValues,
  type CrearAgenciaFormValues,
} from '../models/agencia.model'

/** Campos por los que el backend acepta ordenar el listado de agencias. */
export type AgenciaSortBy = 'nombre' | 'createdAt' | 'cantidadParadasHomologadas'

/** Filtros server-side soportados por `GET /agencias`. */
export interface ObtenerAgenciasParams {
  page?: number
  limit?: number
  /** Búsqueda parcial por nombre (ILIKE en el backend). */
  nombre?: string
  /** `undefined` = sin filtro de estado. */
  activo?: boolean
  sortBy?: AgenciaSortBy
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Listado paginado de agencias.
 *
 * Devuelve SÓLO las filas sin padre —las empresas—, cada una con sus agencias
 * en `hijas`. Las hijas no se administran desde este listado: las trae la
 * sincronización desde el web service.
 *
 * La búsqueda y el filtro de estado los resuelve el backend: filtrar en el
 * cliente sólo alcanzaba a las filas de la página actual.
 */
export async function obtenerAgencias(
  params: ObtenerAgenciasParams = {},
): Promise<AgenciasPaginadasResponse> {
  const { page = 1, limit = 10, nombre, activo, sortBy, sortOrder } = params

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (nombre) query.append('nombre', nombre)
  if (activo !== undefined) query.append('activo', String(activo))
  if (sortBy) query.append('sortBy', sortBy)
  if (sortOrder) query.append('sortOrder', sortOrder)

  return apiFetch<AgenciasPaginadasResponse>(`/agencias?${query.toString()}`, {
    fallbackMessage: 'Error al obtener las agencias.',
  })
}

export async function actualizarAgencia(
  id: string,
  data: AgenciaFormValues,
): Promise<Agencia> {
  return apiFetch<Agencia>(`/agencias/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    fallbackMessage: 'Error al actualizar la agencia.',
  })
}

export async function eliminarAgencia(id: string): Promise<void> {
  await apiFetch<null>(`/agencias/${id}`, {
    method: 'DELETE',
    fallbackMessage: 'Error al eliminar la agencia.',
  })
}

/** Máximo de agencias por lote (espeja el `@ArrayMaxSize(100)` del backend). */
export const MAX_BULK_DELETE = 100

export interface BulkDeleteFailure {
  id: string
  motivo: string
}

/**
 * Resultado de un borrado en lote.
 *
 * Los nombres de los campos replican los de `BulkDeleteAgenciasResponseDto`
 * del backend.
 */
export interface BulkDeleteResult {
  solicitados: number
  eliminados: string[]
  fallidos: BulkDeleteFailure[]
}

/**
 * Borrado en lote de agencias: `POST /agencias/bulk-delete`.
 *
 * Es POST y no DELETE porque el cuerpo de un DELETE no está garantizado por
 * todos los clientes y proxies. El backend deduplica y limita a 100; se hace lo
 * mismo acá para no depender de que el servidor recorte.
 *
 * Los fallos son parciales por diseño: la respuesta trae `eliminados` y
 * `fallidos` con su motivo, y el hook los reporta por separado.
 */
export async function eliminarAgencias(
  ids: string[],
): Promise<BulkDeleteResult> {
  const uniqueIds = [...new Set(ids)].slice(0, MAX_BULK_DELETE)

  return apiFetch<BulkDeleteResult>('/agencias/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids: uniqueIds }),
    fallbackMessage: 'Error al eliminar las agencias.',
  })
}

export async function crearAgencia(
  data: CrearAgenciaFormValues,
): Promise<Agencia> {
  const formData = new FormData()
  formData.append('nombre', data.nombre)
  formData.append('password', data.password)

  if (data.agenciaPrincipal) {
    formData.append('agenciaPrincipal', data.agenciaPrincipal)
  }
  if (data.usuario) {
    formData.append('usuario', data.usuario)
  }
  if (data.descripcion) {
    formData.append('descripcion', data.descripcion)
  }
  if (data.url) {
    formData.append('url', data.url)
  }
  if (data.porcentajeVentas !== undefined) {
    formData.append('porcentajeVentas', data.porcentajeVentas.toString())
  }
  // El switch "Activo" del drawer no llegaba nunca al backend (CR-4).
  if (data.activo !== undefined) {
    formData.append('activo', String(data.activo))
  }
  if (data.profileImage) {
    formData.append('profileImage', data.profileImage)
  }

  return apiFetch<Agencia>('/agencias', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Error al crear la agencia.',
  })
}

/**
 * Una agencia por id. Sirve para una empresa y para una agencia hija.
 *
 * Es la única forma de conocer el `heredaComision` y el `porcentajeVentas`
 * propios de una hija: el listado embebe las hijas con un DTO reducido que no
 * los incluye.
 */
export async function obtenerAgenciaPorId(id: string): Promise<Agencia> {
  return apiFetch<Agencia>(`/agencias/${id}`, {
    fallbackMessage: 'Error al obtener la agencia.',
  })
}

export interface ParadaHomologada {
  id: string
  idExterno?: number
  descripcion?: string
}

export interface PaginatedParadasResponse {
  items: ParadaHomologada[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function obtenerParadasHomologadas(
  agenciaId: string,
  page: number = 1,
  limit: number = 10,
  sortOrder: string = 'DESC',
  descripcion?: string,
  sortBy: string = 'descripcion',
): Promise<PaginatedParadasResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortOrder,
    sortBy,
  })
  if (descripcion) params.append('descripcion', descripcion)

  return apiFetch<PaginatedParadasResponse>(
    `/agencias/${agenciaId}/paradas-homologadas?${params.toString()}`,
    { fallbackMessage: 'Error al obtener paradas homologadas.' },
  )
}

export async function actualizarLogoAgencia(
  id: string,
  profileImage: File,
): Promise<{ imageUrl: string; message: string }> {
  const formData = new FormData()
  formData.append('profileImage', profileImage)

  return apiFetch<{ imageUrl: string; message: string }>(
    `/agencias/${id}/logo`,
    {
      method: 'POST',
      body: formData,
      fallbackMessage: 'Error al actualizar el logo de la agencia.',
    },
  )
}

export interface HijaDeEmpresa {
  id: string
  /** Puede venir vacío: la sincronización crea la agencia aunque el web service no reporte nombre. */
  nombre: string | null
  codigo: string | null
  activo: boolean
  boletosDisponibles: number | null
  /** Si cobra la comisión de su empresa en vez de una propia. */
  heredaComision: boolean
  /** Su porcentaje propio. Sólo se cobra si no hereda. */
  porcentajeVentas: number | null
  /** El que realmente cobra, ya resuelto por el servidor. */
  comisionEfectiva: number | null
  /**
   * Su logo propio, si tiene. En el pasaje se muestra el de quien lo emitió,
   * no el de la empresa que agrupa la conexión.
   */
  urlPerfil: string | null
}

export interface HijasDeEmpresaPage {
  items: HijaDeEmpresa[]
  total: number
  page: number
  limit: number
  totalPages: number
  /** Cuántas de las que cumplen los filtros venden. */
  activas: number
}

export interface HijasDeEmpresaParams {
  page: number
  limit: number
  search?: string
  activo?: boolean
}

/**
 * Una página de las agencias de una empresa, filtrada en el servidor.
 *
 * La comisión llega ya resuelta: recalcularla acá sería la forma segura de que
 * el panel y el informe muestren números distintos por la misma venta.
 */
export async function obtenerHijasPaginadas(
  padreId: string,
  params: HijasDeEmpresaParams,
): Promise<HijasDeEmpresaPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  // Los vacíos no se mandan: `search=` haría filtrar por cadena vacía en vez
  // de no filtrar.
  if (params.search?.trim()) query.set('search', params.search.trim())
  if (params.activo !== undefined) query.set('activo', String(params.activo))

  return apiFetch<HijasDeEmpresaPage>(
    `/agencias/${encodeURIComponent(padreId)}/hijas?${query.toString()}`,
    { fallbackMessage: 'Error al obtener las agencias de la empresa.' },
  )
}
