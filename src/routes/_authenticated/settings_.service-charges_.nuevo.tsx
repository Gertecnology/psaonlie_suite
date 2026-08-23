import { createFileRoute } from '@tanstack/react-router'
import { ServiceChargeForm } from '@/features/settings/service-charges/components/service-charge-form'

/**
 * Two trailing underscores, two different things.
 *
 * `settings_` keeps the URL at `/settings/...` while staying out of the
 * settings layout, exactly like the list does. `service-charges_` keeps this
 * page out of the *list* route: without it TanStack reads the dots as a
 * hierarchy, hangs this route under `settings_.service-charges`, and — since a
 * list page has no `<Outlet/>` — entering "nuevo" would render the list again.
 */
export const Route = createFileRoute(
  '/_authenticated/settings_/service-charges_/nuevo',
)({
  component: () => <ServiceChargeForm />,
})
