import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { esquemaTablaUrl } from '@/components/data-table'
import { DestinationsPage } from '@/features/destinations/components/destinations-page'

/**
 * Page, search, sort and the status filter live in the URL, so the list can be
 * shared as a link and survives a reload.
 */
const esquemaBusqueda = esquemaTablaUrl.extend({
  activo: z.enum(['true', 'false']).optional(),
})

export const Route = createFileRoute('/_authenticated/destinations/')({
  validateSearch: esquemaBusqueda,
  component: DestinationsPage,
})
