import { createFileRoute } from '@tanstack/react-router'
import { IndiceInformes } from '@/features/reports/components/indice-informes'

export const Route = createFileRoute('/_authenticated/reports/')({
  component: IndiceInformes,
})
