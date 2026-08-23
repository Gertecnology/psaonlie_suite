import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { esquemaTablaUrl } from '@/components/data-table'
import { AgenciasPage } from '@/features/agencias/components/agencias-page'

/**
 * Page, search, sort and the status filter all live in the URL, so the list is
 * shareable as a link and survives a reload.
 */
const esquemaBusqueda = esquemaTablaUrl.extend({
  activo: z
    .union([z.boolean(), z.enum(['true', 'false']).transform((v) => v === 'true')])
    .optional(),
})

export const Route = createFileRoute('/_authenticated/agencias/')({
  validateSearch: esquemaBusqueda,
  component: AgenciasPage,
})
