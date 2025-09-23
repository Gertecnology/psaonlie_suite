/* eslint-disable no-console */
import { useState, useEffect } from 'react'
import { Bell, Check, CheckCheck, X, AlertCircle, Info, AlertTriangle, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotificationsApi } from '@/hooks/use-notifications-api'
import { type NotificationResponse } from '@/services/notifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface HeaderNotificationsProps {
  className?: string
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return <Zap className="w-4 h-4 text-red-600" />
    case 'HIGH':
      return <AlertCircle className="w-4 h-4 text-orange-600" />
    case 'MEDIUM':
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />
    case 'LOW':
      return <Info className="w-4 h-4 text-blue-600" />
    default:
      return <Info className="w-4 h-4 text-gray-600" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'border-l-red-500 bg-red-50'
    case 'HIGH':
      return 'border-l-orange-500 bg-orange-50'
    case 'MEDIUM':
      return 'border-l-yellow-500 bg-yellow-50'
    case 'LOW':
      return 'border-l-blue-500 bg-blue-50'
    default:
      return 'border-l-gray-500 bg-gray-50'
  }
}

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-100 text-red-800'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800'
    case 'LOW':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function HeaderNotifications({ className }: HeaderNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [markingAsRead, setMarkingAsRead] = useState<Set<string>>(new Set())
  
  const {
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount
  } = useNotificationsApi()

  // Cargar notificaciones no leídas cuando se abre el popover
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      loadUnreadNotifications()
    }
  }, [isOpen, notifications.length])

  // Recargar notificaciones cuando cambie el conteo de no leídas
  useEffect(() => {
    if (isOpen && unreadCount === 0 && notifications.length > 0) {
      // Si no hay notificaciones no leídas, limpiar la lista
      setNotifications([])
    }
  }, [isOpen, unreadCount, notifications.length])

  const loadUnreadNotifications = async () => {
    setIsLoading(true)
    try {
      const { notificationsService } = await import('@/services/notifications')
      const response = await notificationsService.getAllNotifications({
        limit: 10,
        sortOrder: 'DESC',
        unreadOnly: true
      })
      setNotifications(response.items)
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Agregar a la lista de notificaciones siendo marcadas como leídas
      setMarkingAsRead(prev => new Set(prev).add(notificationId))
      
      await markAsRead(notificationId)
      
      // Esperar un poco para mostrar la animación
      setTimeout(() => {
        // Remover la notificación de la lista local
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
        // Remover de la lista de notificaciones siendo marcadas
        setMarkingAsRead(prev => {
          const newSet = new Set(prev)
          newSet.delete(notificationId)
          return newSet
        })
        // Actualizar el conteo
        refreshUnreadCount()
      }, 500) // 500ms para la animación
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error)
      // En caso de error, remover de la lista de notificaciones siendo marcadas
      setMarkingAsRead(prev => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      // Limpiar las notificaciones del estado local
      setNotifications([])
      // Actualizar el conteo
      await refreshUnreadCount()
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Notificaciones</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {unreadCount} sin leer
                </Badge>
              )}
            </div>
            
            {notifications.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-7 px-2 text-xs"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-96">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay notificaciones</p>
            </div>
          ) : (
             <div className="p-2">
               {notifications.map((notification, index) => {
                 const isMarkingAsRead = markingAsRead.has(notification.id)
                 return (
                   <div key={notification.id}>
                     <div className={`p-3 rounded-lg border-l-4 transition-all duration-500 ease-in-out ${
                       isMarkingAsRead 
                         ? 'opacity-50 scale-95 bg-green-50 border-l-green-500' 
                         : getPriorityColor(notification.priority)
                     }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1">
                        {getPriorityIcon(notification.priority)}
                        <h4 className="font-medium text-sm line-clamp-1">
                          {notification.title}
                        </h4>
                        <Badge variant="secondary" className={`text-xs ${getPriorityBadgeColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                      </div>
                      
                       <div className="flex items-center gap-1">
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleMarkAsRead(notification.id)}
                           disabled={isMarkingAsRead}
                           className={`h-6 w-6 p-0 hover:bg-gray-200 transition-colors ${
                             isMarkingAsRead ? 'bg-green-100 text-green-600' : ''
                           }`}
                           title={isMarkingAsRead ? "Marcando como leída..." : "Marcar como leída"}
                         >
                           <Check className={`w-3 h-3 ${isMarkingAsRead ? 'animate-pulse' : ''}`} />
                         </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClose}
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                          title="Cerrar"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {notification.message}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: es
                        })}
                      </span>
                      <span className="capitalize">
                        {notification.type.toLowerCase().replace('_', ' ')}
                      </span>
                     </div>
                   </div>
                   
                   {index < notifications.length - 1 && (
                     <Separator className="my-2" />
                   )}
                 </div>
                 )
               })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
