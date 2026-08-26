import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { RoundTripFlow } from '@/features/sales/components/round-trip-flow'
import { RoundTripProvider } from '@/features/sales/context/round-trip-context'

export const Route = createFileRoute('/_authenticated/sales/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <RoundTripProvider>
      <PageLayout
        title='Ventas'
        description='Buscá un servicio disponible y vendé el pasaje sin salir del panel.'
        showSearch={true}
      >
        <RoundTripFlow />
      </PageLayout>
    </RoundTripProvider>
  )
}
