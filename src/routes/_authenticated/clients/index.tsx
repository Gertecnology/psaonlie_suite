import { createFileRoute } from '@tanstack/react-router'
import { esquemaTablaUrl } from '@/components/data-table'
import { ClientsPage } from '@/features/clients/components/clients-page'

/**
 * Page and search live in the URL, so the list survives a reload and can be
 * shared as a link.
 */
export const Route = createFileRoute('/_authenticated/clients/')({
  validateSearch: esquemaTablaUrl,
  component: ClientsPage,
})
