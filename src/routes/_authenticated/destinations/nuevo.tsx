import { createFileRoute } from '@tanstack/react-router'
import { DestinationForm } from '@/features/destinations/components/destination-form'

export const Route = createFileRoute('/_authenticated/destinations/nuevo')({
  component: () => <DestinationForm />,
})
