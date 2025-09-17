import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { SeatSelectionPage } from '@/features/sales/components/asientos/seat-selection-page'

export const Route = createFileRoute('/_authenticated/sales/seats')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageLayout
      title="Selección de Asientos"
      description="Selecciona tu asiento preferido para el viaje."
      showSearch={false}
    >
      <SeatSelectionPage />
    </PageLayout>
  )
}
