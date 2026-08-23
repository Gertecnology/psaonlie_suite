import { createFileRoute } from '@tanstack/react-router'
import { ServiceChargeForm } from '@/features/settings/service-charges/components/service-charge-form'

function EditarCargoPorServicio() {
  const { id } = Route.useParams()
  return <ServiceChargeForm serviceChargeId={id} />
}

/** El `service-charges_` es lo que evita que esta ruta cuelgue del listado. */
export const Route = createFileRoute(
  '/_authenticated/settings_/service-charges_/$id/editar',
)({
  component: EditarCargoPorServicio,
})
