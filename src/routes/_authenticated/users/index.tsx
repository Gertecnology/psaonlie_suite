import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { esquemaTablaUrl } from '@/components/data-table'
import { UsersPage } from '@/features/users/components/users-page'

/** Page, search and the status filter live in the URL. */
const esquemaBusqueda = esquemaTablaUrl.extend({
  activo: z.enum(['true', 'false']).optional(),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: esquemaBusqueda,
  component: UsersPage,
})
