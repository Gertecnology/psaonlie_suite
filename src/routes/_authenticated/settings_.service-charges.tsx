import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { esquemaTablaUrl } from '@/components/data-table'
import { ServiceChargesPage } from '@/features/settings/service-charges/components/service-charges-page'

/**
 * The URL stays `/settings/service-charges`, but the trailing underscore keeps
 * the page out of the settings layout.
 *
 * That layout wraps everything it renders in a `PageLayout` of its own, and
 * this is a full list page, not a settings section: nested, the two would draw
 * two fixed headers on top of each other, two `<main>` elements and three
 * `<h1>`s. Out of it, the page owns its header like every other list.
 */
const esquemaBusqueda = esquemaTablaUrl.extend({
  tipoAplicacion: z.enum(['PORCENTUAL', 'FIJO']).optional(),
  esGlobal: z.enum(['true', 'false']).optional(),
  activo: z.enum(['true', 'false']).optional(),
})

export const Route = createFileRoute('/_authenticated/settings_/service-charges')({
  validateSearch: esquemaBusqueda,
  component: ServiceChargesPage,
})
