import { z } from 'zod'

// Schema for the data coming from the API (for the table)
export const companySchema = z.object({
  id: z.string(),
  urlPerfil: z.string().url().nullable(),
  nombre: z.string(),
  agencia: z.string(),
  usuario: z.string(),
  descripcion: z.string().nullable(),
  url: z.string().url().nullable(),
  activo: z.boolean(),
  createdAt: z.string().transform((str) => new Date(str).toLocaleDateString()),
})

// Schema for the creation form
export const createCompanySchema = z.object({
  urlPerfil: z.string().url({ message: 'URL de perfil inválida.' }).optional().or(z.literal('')),
  nombre: z.string().min(1, { message: 'El nombre es requerido.' }),
  agencia: z.string().min(1, { message: 'La agencia es requerida.' }),
  usuario: z.string().min(1, { message: 'El usuario es requerido.' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres.' }),
  descripcion: z.string().optional(),
  url: z.string().url({ message: 'URL inválida.' }).optional().or(z.literal('')),
})

export type Company = z.infer<typeof companySchema>
export type CreateCompany = z.infer<typeof createCompanySchema> 