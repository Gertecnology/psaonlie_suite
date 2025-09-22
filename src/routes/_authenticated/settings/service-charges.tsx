import { createFileRoute } from '@tanstack/react-router'
import { ServiceChargesPage } from '@/features/settings/service-charges'

export const Route = createFileRoute('/_authenticated/settings/service-charges')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
      <ServiceChargesPage />
  )
}