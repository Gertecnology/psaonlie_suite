import { PageLayout, PageLayoutWithSearch, PageLayoutSimple } from './page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Ejemplo 1: Página estándar con tabla y acciones
export function ExampleStandardPage() {
  return (
    <PageLayout
      title="Empresas"
      description="Gestiona las empresas de transporte."
      actions={
        <div className="flex gap-2">
          <Button>Crear Empresa</Button>
          <Button variant="outline">Exportar</Button>
        </div>
      }
    >
      <div className="rounded-md border">
        {/* Aquí iría tu DataTable */}
        <div className="p-4 text-center text-muted-foreground">
          Tabla de empresas aquí
        </div>
      </div>
    </PageLayout>
  )
}

// Ejemplo 2: Dashboard simple sin búsqueda
export function ExampleDashboard() {
  return (
    <PageLayout
      title="Dashboard"
      description="Panel de control principal del sistema"
      showSearch={false}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+2 desde el mes pasado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destinos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">+5 desde el mes pasado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+12 desde el mes pasado</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tareas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">-3 desde el mes pasado</p>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}

// Ejemplo 3: Página de configuración con layout fijo
export function ExampleSettingsPage() {
  return (
    <PageLayout
      title="Configuración"
      description="Gestiona tu cuenta y preferencias del sistema"
      fixedMain={true}
      className="space-y-6"
    >
      <div className="flex gap-6">
        <aside className="w-1/5">
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">Perfil</Button>
            <Button variant="ghost" className="w-full justify-start">Cuenta</Button>
            <Button variant="ghost" className="w-full justify-start">Apariencia</Button>
            <Button variant="ghost" className="w-full justify-start">Notificaciones</Button>
          </nav>
        </aside>
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuración del Perfil</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Aquí puedes configurar tu perfil de usuario.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}

// Ejemplo 4: Página simple sin controles del header
export function ExampleSimplePage() {
  return (
    <PageLayoutSimple
      title="Página Simple"
      description="Esta es una página sin controles del header"
    >
      <Card>
        <CardHeader>
          <CardTitle>Contenido Simple</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Esta página no tiene búsqueda ni controles del header.</p>
        </CardContent>
      </Card>
    </PageLayoutSimple>
  )
}

// Ejemplo 5: Página con búsqueda siempre visible
export function ExampleSearchPage() {
  return (
    <PageLayoutWithSearch
      title="Búsqueda Avanzada"
      description="Encuentra lo que necesitas rápidamente"
      actions={<Button>Filtros</Button>}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Búsqueda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Los resultados de tu búsqueda aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageLayoutWithSearch>
  )
}

// Ejemplo 6: Página con header no fijo
export function ExampleNonFixedHeader() {
  return (
    <PageLayout
      title="Página con Header No Fijo"
      description="El header no se mantiene fijo al hacer scroll"
      fixedHeader={false}
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Contenido</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Esta página tiene un header que no se mantiene fijo.</p>
          </CardContent>
        </Card>
        
        {/* Contenido adicional para demostrar scroll */}
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Sección {i + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Contenido de la sección {i + 1}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageLayout>
  )
}
