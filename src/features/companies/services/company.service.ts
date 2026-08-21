import { apiFetch, ApiError } from '@/utils/api-client'
import {
  type Company,
  type PaginatedCompaniesResponse,
  type CompanyFormValues,
  type CreateCompanyFormValues,
} from '../models/company.model'

/** Campos por los que el backend acepta ordenar el listado de empresas. */
export type CompanySortBy = 'nombre' | 'createdAt' | 'cantidadParadasHomologadas'

/** Filtros server-side soportados por `GET /empresas`. */
export interface GetCompaniesParams {
  page?: number
  limit?: number
  /** Búsqueda parcial por nombre (ILIKE en el backend). */
  nombre?: string
  /** `undefined` = sin filtro de estado. */
  activo?: boolean
  sortBy?: CompanySortBy
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Listado paginado de empresas.
 *
 * La búsqueda y el filtro de estado los resuelve el backend: filtrar en el
 * cliente sólo alcanzaba a las filas de la página actual.
 */
export async function getCompanies(
  params: GetCompaniesParams = {},
): Promise<PaginatedCompaniesResponse> {
  const { page = 1, limit = 10, nombre, activo, sortBy, sortOrder } = params

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (nombre) query.append('nombre', nombre)
  if (activo !== undefined) query.append('activo', String(activo))
  if (sortBy) query.append('sortBy', sortBy)
  if (sortOrder) query.append('sortOrder', sortOrder)

  return apiFetch<PaginatedCompaniesResponse>(`/empresas?${query.toString()}`, {
    fallbackMessage: 'Error al obtener las empresas.',
  })
}

// Service to update a company
export async function updateCompany(
  id: string,
  data: CompanyFormValues,
): Promise<Company> {
  return apiFetch<Company>(`/empresas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    fallbackMessage: 'Error al actualizar la empresa.',
  })
}

// Service to delete a company
export async function deleteCompany(id: string): Promise<void> {
  await apiFetch<null>(`/empresas/${id}`, {
    method: 'DELETE',
    fallbackMessage: 'Error al eliminar la empresa.',
  })
}

/** Máximo de empresas por lote (espeja el `@ArrayMaxSize(100)` del backend). */
export const MAX_BULK_DELETE = 100

export interface BulkDeleteFailure {
  id: string
  motivo: string
}

/**
 * Resultado de un borrado en lote.
 *
 * Los nombres de los campos replican los de `BulkDeleteEmpresasResponseDto`
 * del backend, para que migrar al endpoint dedicado no obligue a tocar el hook
 * ni los componentes.
 */
export interface BulkDeleteResult {
  solicitados: number
  eliminados: string[]
  fallidos: BulkDeleteFailure[]
}

/**
 * Borrado en lote de empresas.
 *
 * PENDIENTE(backend): el endpoint dedicado todavía no está expuesto en
 * `empresa.controller.ts` (el DTO `BulkDeleteEmpresasDto` ya existe, la ruta
 * no). Mientras tanto se itera `DELETE /empresas/:id` y se reportan los fallos
 * parciales.
 *
 * Para migrar cuando la ruta exista, reemplazar el cuerpo por:
 *   return apiFetch<BulkDeleteResult>('<ruta>', {
 *     method: '<verbo>',
 *     body: JSON.stringify({ ids: uniqueIds }),
 *     fallbackMessage: 'Error al eliminar las empresas.',
 *   })
 * El tipo de retorno ya coincide con `BulkDeleteEmpresasResponseDto`.
 */
export async function deleteCompanies(
  ids: string[],
): Promise<BulkDeleteResult> {
  // El backend deduplica y limita a 100; hacemos lo mismo acá para que el
  // comportamiento no cambie al migrar.
  const uniqueIds = [...new Set(ids)].slice(0, MAX_BULK_DELETE)

  const outcomes = await Promise.allSettled(
    uniqueIds.map(async (id) => {
      await deleteCompany(id)
      return id
    }),
  )

  const result: BulkDeleteResult = {
    solicitados: uniqueIds.length,
    eliminados: [],
    fallidos: [],
  }

  outcomes.forEach((outcome, index) => {
    if (outcome.status === 'fulfilled') {
      result.eliminados.push(outcome.value)
      return
    }

    const reason = outcome.reason
    const motivo =
      reason instanceof ApiError || reason instanceof Error
        ? reason.message
        : 'Error desconocido al eliminar la empresa.'

    result.fallidos.push({ id: uniqueIds[index], motivo })
  })

  return result
}

// Service to create a company
export async function createCompany(
  data: CreateCompanyFormValues,
): Promise<Company> {
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

  return apiFetch<Company>('/empresas', {
    method: 'POST',
    body: formData,
    fallbackMessage: 'Error al crear la empresa.',
  })
}

// Obtener empresa por id
export async function getCompanyById(id: string): Promise<Company> {
  return apiFetch<Company>(`/empresas/${id}`, {
    fallbackMessage: 'Error al obtener la empresa.',
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

// Obtener paradas homologadas paginadas
export async function getParadasHomologadas(
  empresaId: string,
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
    `/empresas/${empresaId}/paradas-homologadas?${params.toString()}`,
    { fallbackMessage: 'Error al obtener paradas homologadas.' },
  )
}

// Service to update company logo
export async function updateCompanyLogo(
  id: string,
  profileImage: File,
): Promise<{ imageUrl: string; message: string }> {
  const formData = new FormData()
  formData.append('profileImage', profileImage)

  return apiFetch<{ imageUrl: string; message: string }>(
    `/empresas/${id}/logo`,
    {
      method: 'POST',
      body: formData,
      fallbackMessage: 'Error al actualizar el logo de la empresa.',
    },
  )
}
