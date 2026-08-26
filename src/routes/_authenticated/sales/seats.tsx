import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { SeatSelectionPage } from '@/features/sales/components/asientos/seat-selection-page'

export const Route = createFileRoute('/_authenticated/sales/seats')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageLayout
      title='Selección de Asientos'
      description='El plano del servicio en tiempo real: tocá un asiento libre para elegirlo.'
      showSearch={false}
    >
      <SeatSelectionPage />
    </PageLayout>
  )
}
