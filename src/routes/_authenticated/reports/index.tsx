import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { ReportsPage } from '@/features/reports'

export const Route = createFileRoute('/_authenticated/reports/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <PageLayout
      title="Reportes"
      description="Genera y exporta reportes detallados de ventas con filtros personalizados."
      showSearch={true}
    >
      <ReportsPage />
    </PageLayout>
  )
}
