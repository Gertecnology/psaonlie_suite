import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { CheckoutPage } from '@/features/sales/components/checkout/checkout-page'

export const Route = createFileRoute('/_authenticated/sales/checkout')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageLayout
      title="Checkout"
      description="Confirma tu reserva antes del pago."
      showSearch={false}
    >
      <CheckoutPage />
    </PageLayout>
  )
}