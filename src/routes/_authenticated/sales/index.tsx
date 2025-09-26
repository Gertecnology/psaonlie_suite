import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { RoundTripProvider } from '@/features/sales/context/round-trip-context'
import { RoundTripFlow } from '@/features/sales/components/round-trip-flow'

export const Route = createFileRoute('/_authenticated/sales/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <RoundTripProvider>
      <PageLayout
        title="Ventas"
        description="Busca y gestiona los servicios de transporte disponibles."
        showSearch={true}
      >
        <RoundTripFlow />
      </PageLayout>
    </RoundTripProvider>
  )
}