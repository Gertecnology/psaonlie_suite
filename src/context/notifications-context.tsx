/* eslint-disable no-console */
import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useAuth } from '@/context/auth-context'
import { usePersistentSocket } from '@/hooks/use-persistent-socket'
import { useTokenMonitor } from '@/hooks/use-token-monitor'
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
    refreshToken,
    ensureConnection,
    keepAlive
  } = usePersistentSocket()
  
  // Hook para manejar las notificaciones de la API
  const {
    unreadCount: apiUnreadCount,
    refreshUnreadCount,
    markAsRead: apiMarkAsRead,
    markAllAsRead: apiMarkAllAsRead,
    deleteNotification: apiDeleteNotification
  } = useNotificationsApi()
  
  // Monitorear el token automáticamente
  useTokenMonitor()
  
  // Usar sessionStorage para persistir el estado de inicialización
  const SOCKET_INITIALIZED_KEY = 'socket-initialized'

  // Efecto para mantener la conexión activa
  useEffect(() => {
    if (!isAuthenticated) return

    // Verificar conexión cada 30 segundos
    const connectionCheckInterval = setInterval(async () => {
      if (!isConnected) {
        console.log('Verificando conexión del socket...')
        await ensureConnection()
      } else {
        // Enviar ping para mantener conexión activa
        keepAlive()
      }
    }, 30000)

    return () => {
      clearInterval(connectionCheckInterval)
    }
  }, [isAuthenticated, isConnected, ensureConnection, keepAlive])

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

  const handleNewNotification = useCallback((data: unknown) => {
    console.log('Nueva notificación recibida:', data)
    
    try {
      const notification = data as NotificationData
      
      // Validar que la notificación tenga los campos requeridos
      if (!notification.id || !notification.title || !notification.message) {
        console.error('Notificación inválida recibida:', notification)
        return
      }
      
      // Agregar a la lista de notificaciones
      setNotifications(prev => {
        // Evitar duplicados
        const exists = prev.some(n => n.id === notification.id)
        if (exists) {
          console.log('Notificación duplicada ignorada:', notification.id)
          return prev
        }
        
        console.log('Agregando nueva notificación a la lista:', notification.title)
        return [notification, ...prev.slice(0, 9)] // Mantener solo las últimas 10
      })
      
      // Actualizar el conteo de notificaciones no leídas desde la API
      refreshUnreadCount()
      
      // Mostrar toast
      toast.success(notification.title, {
        description: notification.message,
        duration: 8000,
        position: 'top-right'
      })
      
      console.log('Notificación procesada exitosamente')
    } catch (error) {
      console.error('Error al procesar notificación:', error)
    }
  }, [refreshUnreadCount])

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
      
      // Usar ensureConnection para una reconexión más robusta
      const success = await ensureConnection()
      
      if (success) {
        // Reconfigurar listeners
        addListener('new-notification', handleNewNotification)
        addListener('connect', handleConnect)
        addListener('disconnect', handleDisconnect)
        addListener('connect_error', handleConnectError)
        
        console.log('Reconexión desde contexto completada exitosamente')
      } else {
        console.error('No se pudo reconectar desde contexto')
      }
    } catch (error) {
      console.error('Error en reconexión desde contexto:', error)
    }
  }, [ensureConnection, addListener, handleNewNotification, handleConnect, handleDisconnect, handleConnectError])

  // Método para limpiar completamente el estado y forzar reconexión
  const forceReconnect = useCallback(async () => {
    console.log('Forzando reconexión completa...')
    
    // Limpiar todos los estados
    sessionStorage.removeItem(SOCKET_INITIALIZED_KEY)
    sessionStorage.removeItem('socket_connection_state')
    
    // Limpiar notificaciones
    setNotifications([])
    
    // Forzar reconexión
    await reconnect()
  }, [reconnect])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    // Obtener token del localStorage
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error('No hay token de acceso disponible')
      return
    }

    // Verificar si ya se inicializó en esta sesión Y si la conexión está realmente activa
    const isInitialized = sessionStorage.getItem(SOCKET_INITIALIZED_KEY) === 'true'
    const isActuallyConnected = isConnected
    
    if (isInitialized && isActuallyConnected) {
      console.log('Socket ya inicializado y conectado en esta sesión, reutilizando conexión')
      return
    }

    // Si está marcado como inicializado pero no está conectado, limpiar el flag
    if (isInitialized && !isActuallyConnected) {
      console.log('Socket marcado como inicializado pero no conectado, limpiando flag y reconectando')
      sessionStorage.removeItem(SOCKET_INITIALIZED_KEY)
    }

    // Marcar como inicializado en sessionStorage
    sessionStorage.setItem(SOCKET_INITIALIZED_KEY, 'true')

    // Conectar cuando el usuario esté autenticado
    const initConnection = async () => {
      try {
        console.log('Inicializando conexión del socket desde contexto...')
        await connectSocket(token)
        
        // Configurar listeners usando los métodos persistentes
        addListener('new-notification', handleNewNotification)
        addListener('connect', handleConnect)
        addListener('disconnect', handleDisconnect)
        addListener('connect_error', handleConnectError)
        
        console.log('Socket configurado desde contexto global con listeners persistentes')
      } catch (error) {
        console.error('Error al inicializar conexión desde contexto:', error)
        // Si falla la conexión, limpiar el flag para permitir reintentos
        sessionStorage.removeItem(SOCKET_INITIALIZED_KEY)
      }
    }

    initConnection()

    return () => {
      // No resetear el flag aquí, mantener la conexión global
      console.log('Contexto de notificaciones desmontado, manteniendo conexión')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isConnected]) // Depender de isAuthenticated e isConnected

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
