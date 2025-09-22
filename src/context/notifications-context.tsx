/* eslint-disable no-console */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/context/auth-context'
import { usePersistentSocket } from '@/hooks/use-persistent-socket'
import { useTokenMonitor } from '@/hooks/use-token-monitor'
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
    refreshToken
  } = usePersistentSocket()
  
  // Monitorear el token automáticamente
  useTokenMonitor()
  
  // Usar sessionStorage para persistir el estado de inicialización
  const SOCKET_INITIALIZED_KEY = 'socket-initialized'

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const handleNewNotification = useCallback((data: unknown) => {
    console.log('Nueva notificación recibida:', data)
    
    const notification = data as NotificationData
    
    // Agregar a la lista de notificaciones
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Mantener solo las últimas 10
    
    // Mostrar toast
    toast.success(notification.title, {
      description: notification.message,
      duration: 8000,
      position: 'top-right'
    })
  }, [])

  const handleConnect = useCallback(() => {
    console.log('Socket conectado desde contexto')
  }, [])

  const handleDisconnect = useCallback(() => {
    console.log('Socket desconectado desde contexto')
  }, [])

  const handleConnectError = useCallback((error: unknown) => {
    console.error('Error de conexión desde contexto:', error)
  }, [])

  const reconnect = useCallback(async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error('No hay token de acceso disponible para reconectar')
      return
    }

    try {
      console.log('Reconexión desde contexto iniciada...')
      
      // Limpiar estado de inicialización para forzar nueva conexión
      sessionStorage.removeItem(SOCKET_INITIALIZED_KEY)
      
      // Intentar conectar nuevamente
      await connectSocket(token)
      
      // Reconfigurar listeners
      addListener('new-notification', handleNewNotification)
      addListener('connect', handleConnect)
      addListener('disconnect', handleDisconnect)
      addListener('connect_error', handleConnectError)
      
      console.log('Reconexión desde contexto completada')
    } catch (error) {
      console.error('Error en reconexión desde contexto:', error)
    }
  }, [connectSocket, addListener, handleNewNotification, handleConnect, handleDisconnect, handleConnectError])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    // Verificar si ya se inicializó en esta sesión
    const isInitialized = sessionStorage.getItem(SOCKET_INITIALIZED_KEY) === 'true'
    if (isInitialized) {
      console.log('Socket ya inicializado en esta sesión, reutilizando conexión')
      return
    }

    // Marcar como inicializado en sessionStorage
    sessionStorage.setItem(SOCKET_INITIALIZED_KEY, 'true')

    // Obtener token del localStorage
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error('No hay token de acceso disponible')
      return
    }

    // Conectar cuando el usuario esté autenticado
    const initConnection = async () => {
      try {
        await connectSocket(token)
        
        // Configurar listeners usando los métodos persistentes
        addListener('new-notification', handleNewNotification)
        addListener('connect', handleConnect)
        addListener('disconnect', handleDisconnect)
        addListener('connect_error', handleConnectError)
        
        console.log('Socket configurado desde contexto global con listeners persistentes')
      } catch (error) {
        console.error('Error al inicializar conexión desde contexto:', error)
      }
    }

    initConnection()

    return () => {
      // No resetear el flag aquí, mantener la conexión global
      console.log('Contexto de notificaciones desmontado, manteniendo conexión')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]) // Solo depender de isAuthenticated

  const unreadCount = notifications.filter(n => !n.isRead).length

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
      reconnect
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
