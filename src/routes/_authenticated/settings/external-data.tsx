import { createFileRoute } from '@tanstack/react-router'
import { ExternalDataPage } from '@/features/external-data'

export const Route = createFileRoute('/_authenticated/settings/external-data')({
  component: ExternalDataPage,
})