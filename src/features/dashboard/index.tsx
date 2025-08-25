import { PageLayout } from '@/components/layout/page-layout'

export default function Dashboard() {
  return (
    <PageLayout
      title="Bienvenido a PasajeOnline"
      description="Panel de control principal del sistema"
      showSearch={false}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Aquí puedes agregar widgets del dashboard */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold">Empresas Activas</h3>
          <p className="text-2xl font-bold">12</p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold">Destinos</h3>
          <p className="text-2xl font-bold">45</p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold">Usuarios</h3>
          <p className="text-2xl font-bold">89</p>
        </div>
        
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="font-semibold">Tareas</h3>
          <p className="text-2xl font-bold">23</p>
        </div>
      </div>
    </PageLayout>
  )
}

