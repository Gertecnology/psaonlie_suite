import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/settings/service-charges')({
  component: ServiceChargesPage,
})

function ServiceChargesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold">Cargos por servicio</h1>
      <p className="text-muted-foreground">Configuración de cargos por servicio</p>
    </div>
  )
}