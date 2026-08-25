import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { PaymentPage } from '@/features/sales/components/payment'

export const Route = createFileRoute('/_authenticated/sales/payment')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageLayout
      title='Procesar Pago'
      description='Cobrá y emití los boletos; el pasajero recibe todo por correo.'
      showSearch={false}
    >
      <PaymentPage />
    </PageLayout>
  )
}
