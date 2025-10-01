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
      description="Visualiza y genera reportes del sistema."
      showSearch={true}
    >
      <ReportsPage />
    </PageLayout>
  )
}
