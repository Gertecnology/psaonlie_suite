import { createFileRoute } from '@tanstack/react-router'
import CompaniesPage from '@/app/(main)/companies/page'

export const Route = createFileRoute('/_authenticated/companies/')({
  component: CompaniesPage,
})

