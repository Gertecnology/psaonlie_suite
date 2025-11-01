import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import VerifyEmail from '@/features/auth/verify-email'

const verifyEmailSearchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/verify-email')({
  component: VerifyEmail,
  validateSearch: verifyEmailSearchSchema,
})
