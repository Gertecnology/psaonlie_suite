import { createFileRoute } from '@tanstack/react-router'
import { ReservasPage } from '@/features/settings/reservas/reservas-page'

export const Route = createFileRoute('/_authenticated/settings/reservas')({
  component: ReservasPage,
})
