import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { SalesPage } from '@/features/sales'

export const Route = createFileRoute('/_authenticated/sales/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageLayout
      title="Ventas"
      description="Busca y gestiona los servicios de transporte disponibles."
      showSearch={false}
    >
      <SalesPage />
    </PageLayout>
  )
}