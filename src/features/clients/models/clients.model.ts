import { z } from 'zod'

export const clienteSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  apellido: z.string(),
  nombre: z.string(),
  nombreCompleto: z.string(),
  fechaNacimiento: z.string().optional(),
  sexo: z.string().optional(),
  nacionalidad: z.string().optional(),
  paisResidencia: z.string().optional(),
  telefono: z.string().optional(),
  ocupacion: z.string().optional(),
  observaciones: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const estadisticasVentasSchema = z.object({
  totalVentas: z.number(),
  ventasPagadas: z.number(),
  ventasPendientes: z.number(),
  ventasCanceladas: z.number(),
  ventasExpiradas: z.number(),
  ventasFallidas: z.number(),
  montoTotalPagado: z.number(),
  montoTotalPendiente: z.number(),
  primeraVenta: z.string().optional(),
  ultimaVenta: z.string().optional(),
})

export const clienteConEstadisticasSchema = z.object({
  cliente: clienteSchema,
  estadisticasVentas: estadisticasVentasSchema,
})

export const clientesListResponseSchema = z.object({
  data: z.array(clienteConEstadisticasSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  resumenGeneral: z.record(z.unknown()),
})

export const clientesSearchParamsSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
  termino: z.string().optional(),
  email: z.string().optional(),
  tipoDocumento: z.string().optional(),
  numeroDocumento: z.string().optional(),
  nacionalidad: z.string().optional(),
  fechaRegistroDesde: z.string().optional(),
  fechaRegistroHasta: z.string().optional(),
  sortBy: z.enum(['nombre', 'apellido', 'email', 'createdAt', 'totalVentas']).default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type Cliente = z.infer<typeof clienteSchema>
export type EstadisticasVentas = z.infer<typeof estadisticasVentasSchema>
export type ClienteConEstadisticas = z.infer<typeof clienteConEstadisticasSchema>
export type ClientesListResponse = z.infer<typeof clientesListResponseSchema>
export type ClientesSearchParams = z.infer<typeof clientesSearchParamsSchema>
