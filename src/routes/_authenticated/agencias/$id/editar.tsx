import { createFileRoute } from '@tanstack/react-router'
import { AgenciaFormulario } from '@/features/agencias/components/agencia-formulario'

function EditarAgencia() {
  const { id } = Route.useParams()
  return <AgenciaFormulario agenciaId={id} />
}

export const Route = createFileRoute('/_authenticated/agencias/$id/editar')({
  component: EditarAgencia,
})
