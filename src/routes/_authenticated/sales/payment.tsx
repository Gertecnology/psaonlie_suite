import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { PaymentPage } from '@/features/sales/components/payment'

export const Route = createFileRoute('/_authenticated/sales/payment')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageLayout
      title="Procesar Pago"
      description="Confirma tu reserva y procede con el pago."
      showSearch={false}
    >
      <PaymentPage />
    </PageLayout>
  )
}