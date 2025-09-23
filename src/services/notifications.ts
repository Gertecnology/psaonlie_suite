/* eslint-disable no-console */
const API_URL = import.meta.env.VITE_API_URL;

export interface UnreadCountResponse {
  unreadCount: number
}

export interface NotificationResponse {
  id: string
  title: string
  message: string
  type: 'VENTA_NUEVA' | 'VENTA_PENDIENTE' | 'PAGO_CONFIRMADO' | 'SISTEMA' | 'PAGO_RECHAZADO'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  data: {
    ventaId?: string
    monto?: number
    numeroTransaccion?: string
    clienteNombre?: string
    importeTotal?: number
    empresaNombre?: string
    fechaVenta?: string
    cantidadBoletos?: number
    metodoPago?: string
    estadoPago?: string
    asientosDetalles?: Array<{
      asiento: string
      precio: number
    }>
    comisionTotal?: number
    observaciones?: string
    authorizationNumber?: string
    motivo?: string
    empresaId?: string
    empresaUrl?: string
    timestamp?: string
  }
  targetRole: string
  targetUserId: string
  isActive: boolean
  expiresAt: string
  createdAt: string
  isRead: boolean
  readAt?: string
}

export interface NotificationsListResponse {
  items: NotificationResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
  unreadCount: number
}

class NotificationsService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken')
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  }

  /**
   * Obtener el número de notificaciones no leídas
   */
  async getUnreadCount(): Promise<number> {
    try {
      console.log('Obteniendo conteo de notificaciones no leídas...')
      
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error al obtener conteo de notificaciones: ${response.status} ${response.statusText}`)
      }

      const data: UnreadCountResponse = await response.json()
      console.log('Conteo de notificaciones no leídas obtenido:', data.unreadCount)
      
      return data.unreadCount
    } catch (error) {
      console.error('Error al obtener conteo de notificaciones no leídas:', error)
      throw error
    }
  }

  /**
   * Obtener todas las notificaciones
   */
  async getAllNotifications(params?: {
    page?: number
    limit?: number
    sortOrder?: 'ASC' | 'DESC'
    type?: string
    priority?: string
    unreadOnly?: boolean
  }): Promise<NotificationsListResponse> {
    try {
      console.log('Obteniendo notificaciones...', params)
      
      // Construir query parameters
      const searchParams = new URLSearchParams()
      if (params?.page) searchParams.append('page', params.page.toString())
      if (params?.limit) searchParams.append('limit', params.limit.toString())
      if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder)
      if (params?.type) searchParams.append('type', params.type)
      if (params?.priority) searchParams.append('priority', params.priority)
      if (params?.unreadOnly !== undefined) searchParams.append('unreadOnly', params.unreadOnly.toString())
      
      const queryString = searchParams.toString()
      const url = `${API_URL}/api/notifications${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error al obtener notificaciones: ${response.status} ${response.statusText}`)
      }

      const data: NotificationsListResponse = await response.json()
      console.log('Notificaciones obtenidas:', data.items.length, 'Total:', data.total)
      
      return data
    } catch (error) {
      console.error('Error al obtener notificaciones:', error)
      throw error
    }
  }

  /**
   * Marcar una notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      console.log('Marcando notificación como leída:', notificationId)
      
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error al marcar notificación como leída: ${response.status} ${response.statusText}`)
      }

      console.log('Notificación marcada como leída exitosamente')
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
      throw error
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(): Promise<void> {
    try {
      console.log('Marcando todas las notificaciones como leídas...')
      
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'PATCH',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error al marcar todas las notificaciones como leídas: ${response.status} ${response.statusText}`)
      }

      console.log('Todas las notificaciones marcadas como leídas exitosamente')
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error)
      throw error
    }
  }

  /**
   * Eliminar una notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      console.log('Eliminando notificación:', notificationId)
      
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Error al eliminar notificación: ${response.status} ${response.statusText}`)
      }

      console.log('Notificación eliminada exitosamente')
    } catch (error) {
      console.error('Error al eliminar notificación:', error)
      throw error
    }
  }
}

export const notificationsService = new NotificationsService()
