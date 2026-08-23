import { createFileRoute } from '@tanstack/react-router'
import { UserForm } from '@/features/users/components/user-form'

function EditarUsuario() {
  const { id } = Route.useParams()
  return <UserForm userId={id} />
}

export const Route = createFileRoute('/_authenticated/users/$id/editar')({
  component: EditarUsuario,
})
