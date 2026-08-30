import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { PasoDeLaVenta } from '@/features/sales/components/paso-de-la-venta'
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
        description='Buscá un servicio y vendé el pasaje sin salir del panel.'
        showSearch={true}
        actions={<PasoDeLaVenta />}
      >
        <RoundTripFlow />
      </PageLayout>
    </RoundTripProvider>
  )
}
