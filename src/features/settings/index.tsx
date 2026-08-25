import { Outlet } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'

export default function Settings() {
  return (
    <PageLayout
      title='Configuración'
      description='Lo que rige para todo el sistema y para tu usuario.'
      showSearch={false}
    >
      <Outlet />
    </PageLayout>
  )
}
