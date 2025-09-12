import { z } from 'zod'

export const serviceChargeSchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido.'),
  descripcion: z.string().nullable().optional(),
  porcentaje: z.number().optional(),
  esGlobal: z.boolean(),
  activo: z.boolean(),
  empresas: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
  })).nullable().optional(),
  fechaInicio: z.string(),
  fechaFin: z.string(),
  tipoAplicacion: z.enum(['PORCENTUAL', 'FIJO']),
  montoFijo: z.number().optional(),
  montoMinimo: z.number().optional(),
  montoMaximo: z.number().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const paginatedServiceChargesSchema = z.object({
  items: z.array(serviceChargeSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const serviceChargeFormSchema = serviceChargeSchema.omit({
  id: true,
  empresas: true,
  createdAt: true,
  updatedAt: true,
})

export const createServiceChargeSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  descripcion: z.string().nullable().optional(),
  porcentaje: z.number().min(0, 'El porcentaje debe ser mayor o igual a 0').optional(),
  activo: z.boolean(),
  esGlobal: z.boolean(),
  fechaInicio: z.string().min(1, 'La fecha de inicio es requerida.'),
  fechaFin: z.string().min(1, 'La fecha de fin es requerida.'),
  tipoAplicacion: z.enum(['PORCENTUAL', 'FIJO', 'MIXTO']),
  montoFijo: z.number().min(0, 'El monto fijo debe ser mayor o igual a 0').optional(),
  montoMinimo: z.number().min(0, 'El monto mínimo debe ser mayor o igual a 0').optional(),
  montoMaximo: z.number().min(0, 'El monto máximo debe ser mayor o igual a 0').optional(),
})

export type ServiceCharge = z.infer<typeof serviceChargeSchema>
export type PaginatedServiceChargesResponse = z.infer<typeof paginatedServiceChargesSchema>
export type ServiceChargeFormValues = z.infer<typeof serviceChargeFormSchema>
export type CreateServiceChargeFormValues = z.infer<typeof createServiceChargeSchema>
