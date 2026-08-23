import { useState } from 'react'
import { type PaginationState, type OnChangeFn } from '@tanstack/react-table'
import { useNotificationsList } from './hooks/use-notifications-list'
import { createNotificationsColumns } from './components/notifications-columns'
import { DataTable } from '@/components/data-table'
import { NotificationsTableToolbar } from './components/notifications-table-toolbar'
import { toast } from 'sonner'

export default function SettingsNotifications() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const [filters, setFilters] = useState<Record<string, string>>({})

  const {
    notifications,
    totalPages,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearError,
    updateParams,
  } = useNotificationsList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortOrder: 'DESC',
    ...filters,
  })

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater
    setPagination(newPagination)
    updateParams({
      page: newPagination.pageIndex + 1,
      limit: newPagination.pageSize,
    })
  }

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, pageIndex: 0 })) // Reset to first page
    updateParams({
      page: 1,
      ...newFilters,
    })
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      toast.success('Notificación marcada como leída')
    } catch {
      toast.error('Error al marcar notificación como leída')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success('Todas las notificaciones marcadas como leídas')
    } catch {
      toast.error('Error al marcar notificaciones como leídas')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      toast.success('Notificación eliminada')
    } catch {
      toast.error('Error al eliminar notificación')
    }
  }

  const columns = createNotificationsColumns({
    onMarkAsRead: handleMarkAsRead,
    onDelete: handleDelete,
  })

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">
          <strong>Error:</strong> {error}
        </p>
        <button
          onClick={clearError}
          className="mt-2 text-red-600 hover:text-red-800 text-sm underline"
        >
          Cerrar
        </button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground">Cargando notificaciones...</p>
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col'>
      <div className='space-y-0.5 mb-6'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Notificaciones
        </h1>
        <p className='text-muted-foreground'>
          Gestiona todas las notificaciones del sistema.
        </p>
      </div>
      
      <DataTable
        columns={columns}
        data={notifications}
        getRowId={(fila) => fila.id}
        pageCount={Math.max(totalPages, 1)}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        caption='Listado de notificaciones del sistema'
        emptyMessage='No hay notificaciones.'
        renderToolbar={(instancia) => (
          <NotificationsTableToolbar
            table={instancia}
            onFilterChange={handleFilterChange}
            onMarkAllAsRead={handleMarkAllAsRead}
            unreadCount={unreadCount}
          />
        )}
      />
    </div>
  )
}
