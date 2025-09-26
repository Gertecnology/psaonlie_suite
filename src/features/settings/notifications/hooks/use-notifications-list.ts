/* eslint-disable no-console */
import { useState, useEffect, useCallback } from 'react'
import { notificationsService, type NotificationResponse, type NotificationsListResponse } from '@/services/notifications'
import { useAuth } from '@/context/auth-context'

export interface NotificationsListParams {
  page?: number
  limit?: number
  sortOrder?: 'ASC' | 'DESC'
  type?: string
  priority?: string
  unreadOnly?: boolean
}

export interface UseNotificationsListReturn {
  // Estado
  notifications: NotificationResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
  unreadCount: number
  isLoading: boolean
  error: string | null
  
  // Acciones
  refreshNotifications: () => Promise<void>
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  
  // Utilidades
  clearError: () => void
  updateParams: (newParams: Partial<NotificationsListParams>) => void
}

export function useNotificationsList(initialParams: NotificationsListParams = {}): UseNotificationsListReturn {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [total, setTotal] = useState<number>(0)
  const [page, setPage] = useState<number>(initialParams.page || 1)
  const [limit, setLimit] = useState<number>(initialParams.limit || 10)
  const [totalPages, setTotalPages] = useState<number>(0)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState<NotificationsListParams>(initialParams)
  
  const { isAuthenticated } = useAuth()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const updateParams = useCallback((newParams: Partial<NotificationsListParams>) => {
    setParams(prev => ({ ...prev, ...newParams }))
    if (newParams.page !== undefined) {
      setPage(newParams.page)
    }
    if (newParams.limit !== undefined) {
      setLimit(newParams.limit)
    }
  }, [])

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      return
    }

    try {
      setIsLoading(true)
      
      const response: NotificationsListResponse = await notificationsService.getAllNotifications({
        page,
        limit,
        sortOrder: params.sortOrder || 'DESC',
        type: params.type,
        priority: params.priority,
        unreadOnly: params.unreadOnly,
      })
      
      setNotifications(response.items)
      setTotal(response.total)
      setTotalPages(response.totalPages)
      setUnreadCount(response.unreadCount)
      
    } catch (error) {
      console.error('Error al actualizar notificaciones:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, params, page, limit])

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
      setTotal(prev => prev - 1)
      
      // Actualizar el conteo si la notificación no estaba leída
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
    } catch (error) {
      console.error('Error al eliminar notificación:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }, [notifications])

  // Cargar datos cuando cambien los parámetros
  useEffect(() => {
    if (!isAuthenticated) {
      // Limpiar estado cuando no esté autenticado
      setNotifications([])
      setTotal(0)
      setUnreadCount(0)
      setError(null)
      return
    }

    refreshNotifications()
  }, [isAuthenticated, refreshNotifications])

  return {
    // Estado
    notifications,
    total,
    page,
    limit,
    totalPages,
    unreadCount,
    isLoading,
    error,
    
    // Acciones
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Utilidades
    clearError,
    updateParams
  }
}
