import { Outlet } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'

export default function Settings() {
  return (
    <PageLayout
      title="Configuración"
      description="Gestiona tus configuraciones y preferencias."
      showSearch={false}
    >
      <Outlet />
    </PageLayout>
  )
}

