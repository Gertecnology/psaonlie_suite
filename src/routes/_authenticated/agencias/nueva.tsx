import { createFileRoute } from '@tanstack/react-router'
import { AgenciaFormulario } from '@/features/agencias/components/agencia-formulario'

export const Route = createFileRoute('/_authenticated/agencias/nueva')({
  component: () => <AgenciaFormulario />,
})
