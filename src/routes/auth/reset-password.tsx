import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import ResetPassword from '@/features/auth/reset-password'

const resetPasswordSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/auth/reset-password')({
  component: ResetPassword,
  validateSearch: resetPasswordSearchSchema,
})
