import { createFileRoute } from '@tanstack/react-router'
import { DestinationForm } from '@/features/destinations/components/destination-form'

function EditarDestino() {
  const { id } = Route.useParams()
  return <DestinationForm destinationId={id} />
}

export const Route = createFileRoute('/_authenticated/destinations/$id/editar')({
  component: EditarDestino,
})
