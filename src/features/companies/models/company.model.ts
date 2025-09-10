import { z } from 'zod'

export const companySchema = z.object({
  id: z.string(),
  nombre: z.string().min(1, 'El nombre es requerido.'),
  agenciaPrincipal: z.string().nullable().optional(),
  usuario: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  activo: z.boolean(),
  urlPerfil: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  cantidadParadasHomologadas: z.number().optional(),
  porcentajeVentas: z.string().nullable().optional(),
  ventaHabilitada: z.string().nullable().optional(),
  agencias: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    codigo: z.string(),
    boletosDisponibles: z.number(),
    activo: z.boolean(),
  })).nullable().optional(),
})

export const paginatedCompaniesSchema = z.object({
  items: z.array(companySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export const companyFormSchema = companySchema.omit({
  id: true,
  urlPerfil: true,
  cantidadParadasHomologadas: true,
})

export const createCompanySchema = companyFormSchema.extend({
  nombre: z.string().min(1, 'El nombre es requerido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  agenciaPrincipal: z.string().nullable().optional(),
  usuario: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  url: z.string().url({ message: 'URL inválida.' }).optional().or(z.literal('')),
  porcentajeVentas: z.number().optional(),
  profileImage: z.instanceof(File).optional(),
})

export type Company = z.infer<typeof companySchema>
export type PaginatedCompaniesResponse = z.infer<typeof paginatedCompaniesSchema>
export type CompanyFormValues = z.infer<typeof companyFormSchema>
export type CreateCompanyFormValues = z.infer<typeof createCompanySchema> 