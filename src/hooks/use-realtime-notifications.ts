/* eslint-disable no-console */
import { useEffect, useState, useCallback } from 'react'
import { useSocket } from '@/utils/socket'
import { useAuth } from '@/context/auth-context'
import { toast } from 'sonner'
import { NotificationData } from '@/components/notifications/notification-toast'

export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()
  const { connectSocket, disconnectSocket, socket, addListener } = useSocket()

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }, [])

  const handleNewNotification = useCallback((data: unknown) => {
    console.log('Nueva notificación recibida:', data)
    
    const notification = data as NotificationData
    
    // Agregar a la lista de notificaciones
    setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Mantener solo las últimas 10
    
    // Mostrar toast simple
    toast.success(notification.title, {
      description: notification.message,
      duration: 8000,
      position: 'top-right'
    })
  }, [])

  const handleConnect = useCallback(() => {
    setIsConnected(true)
    setConnectionError(null)
    console.log('Socket conectado')
  }, [])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    console.log('Socket desconectado')
  }, [])

  const handleConnectError = useCallback((error: unknown) => {
    setIsConnected(false)
    setConnectionError(error instanceof Error ? error.message : 'Error desconocido')
    console.error('Error de conexión:', error)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

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

    // Conectar cuando el usuario esté autenticado
    const initConnection = async () => {
      try {
        await connectSocket(token)
      } catch (error) {
        console.error('Error al inicializar conexión:', error)
      }
    }

    initConnection()

    // Configurar listener para nuevas notificaciones
    addListener('new-notification', handleNewNotification)

    // Escuchar cambios de estado de conexión
    if (socket) {
      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('connect_error', handleConnectError)
    }

    return () => {
      if (socket) {
        socket.off('connect', handleConnect)
        socket.off('disconnect', handleDisconnect)
        socket.off('connect_error', handleConnectError)
      }
      disconnectSocket()
    }
  }, [isAuthenticated, connectSocket, disconnectSocket, addListener, socket, handleNewNotification, handleConnect, handleDisconnect, handleConnectError])

  const unreadCount = notifications.filter(n => !n.isRead).length

  return {
    notifications,
    unreadCount,
    isConnected,
    connectionError,
    markAsRead,
    removeNotification,
    clearAll
  }
}
