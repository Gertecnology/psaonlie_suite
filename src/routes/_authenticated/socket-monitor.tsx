import { createFileRoute } from '@tanstack/react-router'
import { SocketStatusMonitor } from '@/components/notifications/socket-status-monitor'

export const Route = createFileRoute('/_authenticated/socket-monitor')({
  component: SocketStatusMonitor,
})