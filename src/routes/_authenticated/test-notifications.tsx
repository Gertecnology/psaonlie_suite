import { createFileRoute } from '@tanstack/react-router'
import { NotificationsTest } from '@/components/notifications/notifications-test'

export const Route = createFileRoute('/_authenticated/test-notifications')({
  component: NotificationsTest,
})