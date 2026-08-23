import { createFileRoute } from '@tanstack/react-router'
import { ClientForm } from '@/features/clients/components/client-form'

export const Route = createFileRoute('/_authenticated/clients/nuevo')({
  component: () => <ClientForm />,
})
