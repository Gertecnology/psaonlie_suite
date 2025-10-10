import { createFileRoute } from '@tanstack/react-router'
import { DayConfigurationPage } from '@/features/external-data/pages/day-configuration-page'

export const Route = createFileRoute('/_authenticated/settings/external-data/day-configuration')({
  component: DayConfigurationPage,
})
