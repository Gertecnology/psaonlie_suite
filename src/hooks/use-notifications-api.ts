/* eslint-disable no-console */
import { useState, useEffect, useCallback } from 'react'
import { notificationsService, type NotificationResponse } from '@/services/notifications'
import { useAuth } from '@/context/auth-context'

export interface UseNotificationsApiReturn {
  // Estado
  unreadCount: number
  notifications: NotificationResponse[]
  isLoading: boolean
  error: string | null
  
  // Acciones
  refreshUnreadCount: () => Promise<void>
  refreshNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  
  // Utilidades
  clearError: () => void
}

export function useNotificationsApi(): UseNotificationsApiReturn {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const { isAuthenticated } = useAuth()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      const count = await notificationsService.getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error al actualizar conteo de notificaciones:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }, [isAuthenticated])

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      const response = await notificationsService.getAllNotifications({
        limit: 10,
        sortOrder: 'DESC'
      })
      setNotifications(response.items)
    } catch (error) {
      console.error('Error al actualizar notificaciones:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }, [isAuthenticated])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.markAsRead(notificationId)
      
      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      )
      
      // Actualizar el conteo
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsService.markAllAsRead()
      
      // Actualizar el estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
      
      // Resetear el conteo
      setUnreadCount(0)
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }, [])

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationsService.deleteNotification(notificationId)
      
      // Actualizar el estado local
      const notificationToDelete = notifications.find(n => n.id === notificationId)
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
      
      // Actualizar el conteo si la notificación no estaba leída
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }, [notifications])

  // Cargar datos iniciales cuando el usuario esté autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      // Limpiar estado cuando no esté autenticado
      setUnreadCount(0)
      setNotifications([])
      setError(null)
      return
    }

    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        // Cargar conteo y notificaciones en paralelo
        await Promise.all([
          refreshUnreadCount(),
          refreshNotifications()
        ])
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [isAuthenticated, refreshUnreadCount, refreshNotifications])

  // Actualizar conteo periódicamente
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      refreshUnreadCount()
    }, 30000) // Actualizar cada 30 segundos

    return () => clearInterval(interval)
  }, [isAuthenticated, refreshUnreadCount])

  return {
    // Estado
    unreadCount,
    notifications,
    isLoading,
    error,
    
    // Acciones
    refreshUnreadCount,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Utilidades
    clearError
  }
}
