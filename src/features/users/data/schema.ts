import { z } from 'zod'

const roleSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  name: z.string(),
  description: z.string(),
})

const userSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  urlPerfil: z.string().nullable(),
  imagePath: z.string().nullable(),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  lastLoginAt: z.string().nullable(),
  roles: z.array(roleSchema),
})

export type User = z.infer<typeof userSchema>
export type Role = z.infer<typeof roleSchema>

export const usersResponseSchema = z.object({
  data: z.array(userSchema),
  total: z.number(),
  currentPage: z.string(),
  totalPages: z.number(),
  limit: z.string(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
})

export type UsersResponse = z.infer<typeof usersResponseSchema>
