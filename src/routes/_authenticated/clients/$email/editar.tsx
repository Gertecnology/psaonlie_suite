import { createFileRoute } from '@tanstack/react-router'
import { ClientForm } from '@/features/clients/components/client-form'

/**
 * The segment carries an email, not an id.
 *
 * `/api/clientes` keys every single-record operation on the email — there is no
 * endpoint that takes the client's id — so calling the parameter `$id` would
 * name it after something the backend never accepts.
 */
function EditarCliente() {
  const { email } = Route.useParams()
  return <ClientForm email={email} />
}

export const Route = createFileRoute('/_authenticated/clients/$email/editar')({
  component: EditarCliente,
})
