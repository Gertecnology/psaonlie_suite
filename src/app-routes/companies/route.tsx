import { createFileRoute } from '@tanstack/react-router'
import CompaniesPage from '@/app/(main)/companies/page'
import { z } from 'zod'

const companiesSearchSchema = z.object({
  page: z.number().catch(1).optional(),
  perPage: z.number().catch(10).optional(),
})

export const Route = createFileRoute()({
  component: CompaniesPage,
  validateSearch: companiesSearchSchema,
}) 