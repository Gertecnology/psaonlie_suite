/* eslint-disable no-console */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/context/auth-context'
import { usePersistentSocket } from '@/hooks/use-persistent-socket'
import { useNotificationsApi } from '@/hooks/use-notifications-api'
import { toast } from 'sonner'
import { NotificationData } from '@/components/notifications/notification-toast'

interface NotificationsContextType {
  notifications: NotificationData[]
  unreadCount: number
  isConnected: boolean
  connectionError: string | null
  markAsRead: (id: string) => void
  removeNotification: (id: string) => void
  clearAll: () => void
  refreshToken: () => Promise<boolean>
  reconnect: () => Promise<void>
  forceReconnect: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const { isAuthenticated } = useAuth()
  const {
    isConnected,
    connectionError,
    connectSocket,
    addListener,
    removeListener,
    refreshToken,
    ensureConnection,
    forceReconnect: forzarReconexion,
  } = usePersistentSocket()
  
  // Hook para manejar las notificaciones de la API
  const {
    unreadCount: apiUnreadCount,
    refreshUnreadCount,
    markAsRead: apiMarkAsRead,
    markAllAsRead: apiMarkAllAsRead,
    deleteNotification: apiDeleteNotification
  } = useNotificationsApi()
  

  const markAsRead = useCallback(async (id: string) => {
    try {
      // Marcar como leída en la API
      await apiMarkAsRead(id)
      
      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      )
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
    }
  }, [apiMarkAsRead])

  const removeNotification = useCallback(async (id: string) => {
    try {
      // Eliminar de la API
      await apiDeleteNotification(id)
      
      // Actualizar el estado local
      setNotifications(prev => prev.filter(notification => notification.id !== id))
    } catch (error) {
      console.error('Error al eliminar notificación:', error)
    }
  }, [apiDeleteNotification])

  const clearAll = useCallback(async () => {
    try {
      // Marcar todas como leídas en la API
      await apiMarkAllAsRead()
      
      // Limpiar el estado local
      setNotifications([])
    } catch (error) {
      console.error('Error al limpiar todas las notificaciones:', error)
    }
  }, [apiMarkAllAsRead])

  const handleNewNotification = useCallback(
    (data: unknown) => {
      const notification = data as NotificationData

      if (!notification?.id || !notification.title || !notification.message) {
        console.error('Notificación inválida recibida:', notification)
        return
      }

      setNotifications((previas) => {
        if (previas.some((n) => n.id === notification.id)) return previas
        return [notification, ...previas.slice(0, 9)]
      })

      refreshUnreadCount()

      toast.success(notification.title, {
        description: notification.message,
        duration: 8000,
        position: 'top-right',
      })
    },
    [refreshUnreadCount]
  )

  /**
   * Opens the socket once the user is authenticated.
   *
   * The dependency list is deliberately just `isAuthenticated`. It used to be
   * `[isAuthenticated, isConnected]`, which made the connection state re-trigger
   * the connection itself: the socket dropped, `isConnected` went false, the
   * effect re-ran and opened another one. That feedback loop, plus a socket
   * service that never closed the instance it replaced, is what filled the
   * backend log with `jwt expired` from connections nobody could reach.
   *
   * Reconnection is socket.io's job now, so there is no interval here either.
   */
  useEffect(() => {
    if (!isAuthenticated) return

    const token = localStorage.getItem('accessToken')
    if (!token) return

    addListener('new-notification', handleNewNotification)
    void connectSocket(token)

    return () => {
      removeListener('new-notification', handleNewNotification)
    }
  }, [
    isAuthenticated,
    connectSocket,
    addListener,
    removeListener,
    handleNewNotification,
  ])

  /** Reopen the socket. Exposed for the reconnect control in the UI. */
  const reconnect = useCallback(async () => {
    await ensureConnection()
  }, [ensureConnection])

  const forceReconnect = useCallback(async () => {
    setNotifications([])
    await forzarReconexion()
  }, [forzarReconexion])


  // Usar el conteo de la API como fuente de verdad
  const unreadCount = apiUnreadCount

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      isConnected,
      connectionError,
      markAsRead,
      removeNotification,
      clearAll,
      refreshToken,
      reconnect,
      forceReconnect
    }}>
      {children}
    </NotificationsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
