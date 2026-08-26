import { createFileRoute } from '@tanstack/react-router'
import { AgenciaDetailsPage } from '@/features/agencias/components/agencia-details-page'

function DetalleAgencia() {
  const { id } = Route.useParams()
  return <AgenciaDetailsPage agenciaId={id} />
}

export const Route = createFileRoute('/_authenticated/agencias/$id/')({
  component: DetalleAgencia,
})
