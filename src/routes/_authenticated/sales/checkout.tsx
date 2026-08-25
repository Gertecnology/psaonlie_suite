import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { CheckoutPage } from '@/features/sales/components/checkout/checkout-page'

export const Route = createFileRoute('/_authenticated/sales/checkout')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageLayout
      title='Checkout'
      description='Revisá pasajeros, asientos y montos antes de cobrar.'
      showSearch={false}
    >
      <CheckoutPage />
    </PageLayout>
  )
}
