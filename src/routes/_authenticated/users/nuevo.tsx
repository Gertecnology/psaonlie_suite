import { createFileRoute } from '@tanstack/react-router'
import { UserForm } from '@/features/users/components/user-form'

export const Route = createFileRoute('/_authenticated/users/nuevo')({
  component: () => <UserForm />,
})
