/* eslint-disable no-console */
import { type UIEvent, useEffect, useState } from 'react'
import { type NotificationResponse } from '@/services/notifications'
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Info,
  X,
  Zap,
} from 'lucide-react'
import { useNotificationsApi } from '@/hooks/use-notifications-api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface HeaderNotificationsProps {
  readonly className?: string
}

const appendUniqueNotifications = (
  previousItems: NotificationResponse[],
  incomingItems: NotificationResponse[]
) => {
  const uniqueById = new Map<string, NotificationResponse>()

  for (const notification of previousItems) {
    uniqueById.set(notification.id, notification)
  }

  for (const notification of incomingItems) {
    uniqueById.set(notification.id, notification)
  }

  return Array.from(uniqueById.values())
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return <Zap className='h-4 w-4 text-red-600' />
    case 'HIGH':
      return <AlertCircle className='h-4 w-4 text-orange-600' />
    case 'MEDIUM':
      return <AlertTriangle className='h-4 w-4 text-yellow-600' />
    case 'LOW':
      return <Info className='h-4 w-4 text-blue-600' />
    default:
      return <Info className='h-4 w-4 text-gray-600' />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'border-l-red-500 bg-red-50 dark:bg-red-500/10'
    case 'HIGH':
      return 'border-l-orange-500 bg-orange-50 dark:bg-orange-500/10'
    case 'MEDIUM':
      return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'
    case 'LOW':
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-500/10'
    default:
      return 'border-l-gray-500 bg-gray-50 dark:bg-gray-500/10'
  }
}

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400'
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400'
    case 'LOW':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400'
  }
}

export function HeaderNotifications({ className }: HeaderNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [markingAsRead, setMarkingAsRead] = useState<Set<string>>(new Set())
  const [expandedNotifications, setExpandedNotifications] = useState<
    Set<string>
  >(new Set())

  const PAGE_SIZE = 10

  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  const hasMore = notifications.length < totalItems

  const { unreadCount, markAsRead, markAllAsRead, refreshUnreadCount } =
    useNotificationsApi()

  // Bloquear scroll del fondo mientras el popover está abierto
  useEffect(() => {
    if (!isOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // Cargar notificaciones no leídas cuando se abre el popover
  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1)
      setTotalItems(unreadCount)
      setNotifications([])
      loadUnreadNotifications(1)
    }
  }, [isOpen, unreadCount])

  // Recargar notificaciones cuando cambie el conteo de no leídas
  useEffect(() => {
    if (isOpen && unreadCount === 0 && notifications.length > 0) {
      // Si no hay notificaciones no leídas, limpiar la lista
      setNotifications([])
      setCurrentPage(1)
      setTotalItems(0)
    }
  }, [isOpen, unreadCount, notifications.length])

  const loadUnreadNotifications = async (page = 1, append = false) => {
    if (append) {
      setIsFetchingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const { notificationsService } = await import('@/services/notifications')
      const response = await notificationsService.getAllNotifications({
        limit: PAGE_SIZE,
        sortOrder: 'DESC',
        unreadOnly: true,
        page,
      })
      setNotifications((prev) => {
        if (!append) return response.items

        // Evitar duplicados si el backend cambia entre solicitudes.
        return appendUniqueNotifications(prev, response.items)
      })
      // Con unreadOnly=true el backend puede devolver metadatos inconsistentes.
      setCurrentPage(page)
      setTotalItems(Number(response.unreadCount) || Number(response.total) || 0)
    } catch (error) {
      console.error('Error al cargar notificaciones:', error)
    } finally {
      if (append) {
        setIsFetchingMore(false)
      } else {
        setIsLoading(false)
      }
    }
  }

  const handleNotificationsScroll = (e: UIEvent<HTMLDivElement>) => {
    if (isLoading || isFetchingMore || !hasMore) {
      return
    }

    const target = e.target as HTMLDivElement
    const remainingScroll =
      target.scrollHeight - target.scrollTop - target.clientHeight

    if (remainingScroll <= 120) {
      loadUnreadNotifications(currentPage + 1, true)
    }
  }

  const handleLoadMore = () => {
    if (isLoading || isFetchingMore || !hasMore) {
      return
    }

    loadUnreadNotifications(currentPage + 1, true)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Agregar a la lista de notificaciones siendo marcadas como leídas
      setMarkingAsRead((prev) => new Set(prev).add(notificationId))

      await markAsRead(notificationId)

      // Esperar un poco para mostrar la animación
      setTimeout(() => {
        // Remover la notificación de la lista local
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId)
        )
        // Remover de la lista de notificaciones siendo marcadas
        setMarkingAsRead((prev) => {
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
      setMarkingAsRead((prev) => {
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
      console.error(
        'Error al marcar todas las notificaciones como leídas:',
        error
      )
    }
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const toggleExpanded = (notificationId: string) => {
    setExpandedNotifications((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId)
      } else {
        newSet.add(notificationId)
      }
      return newSet
    })
  }

  console.log('Notificaciones cargadas:', notifications)

  return (
    <Popover modal open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className={`relative ${className}`}>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 flex h-5 w-6 items-center justify-center p-0 px-2 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className='h-[70vh] w-[min(24rem,calc(100vw-1rem))] overflow-hidden p-0'
        align='end'
        sideOffset={8}
        onWheelCapture={(e) => e.stopPropagation()}
      >
        <div className='flex h-full flex-col'>
          <div className='shrink-0 border-b p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex min-w-0 items-center gap-2'>
                <h3 className='truncate font-semibold'>Notificaciones</h3>
                {unreadCount > 0 && (
                  <Badge variant='secondary' className='shrink-0 text-xs'>
                    {unreadCount} sin leer
                  </Badge>
                )}
              </div>

              {notifications.length > 0 && (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleMarkAllAsRead}
                  className='h-7 shrink-0 px-2 text-xs'
                >
                  <CheckCheck className='mr-1 h-3 w-3' />
                  Marcar todas
                </Button>
              )}
            </div>
          </div>

          <div className='min-h-0 flex-1'>
            {isLoading ? (
              <div className='text-muted-foreground p-8 text-center'>
                <div className='border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2'></div>
                <p className='text-sm'>Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className='text-muted-foreground p-8 text-center'>
                <Bell className='mx-auto mb-2 h-8 w-8 opacity-50' />
                <p className='text-sm'>No hay notificaciones</p>
              </div>
            ) : (
              <ScrollArea
                className='h-full overscroll-contain'
                onScrollCapture={handleNotificationsScroll}
              >
                <div className='p-2'>
                  {notifications.map((notification, index) => {
                    const isMarkingAsRead = markingAsRead.has(notification.id)
                    const isExpanded = expandedNotifications.has(
                      notification.id
                    )
                    return (
                      <div key={notification.id}>
                        <div
                          className={`rounded-lg border-l-4 p-3 transition-all duration-500 ease-in-out ${
                            isMarkingAsRead
                              ? 'scale-95 border-l-green-500 bg-green-50 dark:bg-green-500/10 opacity-50'
                              : getPriorityColor(notification.priority)
                          }`}
                        >
                          <div className='mb-2 flex items-start justify-between gap-2'>
                            <div className='flex min-w-0 flex-1 items-center gap-2'>
                              {getPriorityIcon(notification.priority)}
                              <h4 className='line-clamp-1 min-w-0 text-sm font-medium'>
                                {notification.title}
                              </h4>
                              <Badge
                                variant='secondary'
                                className={`shrink-0 text-xs ${getPriorityBadgeColor(notification.priority)}`}
                              >
                                {notification.priority}
                              </Badge>
                            </div>

                            <div className='flex items-center gap-1'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() =>
                                  handleMarkAsRead(notification.id)
                                }
                                disabled={isMarkingAsRead}
                                className={`h-6 w-6 p-0 transition-colors hover:bg-gray-200 dark:hover:bg-gray-800 ${
                                  isMarkingAsRead
                                    ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                                    : ''
                                }`}
                                title={
                                  isMarkingAsRead
                                    ? 'Marcando como leída...'
                                    : 'Marcar como leída'
                                }
                              >
                                <Check
                                  className={`h-3 w-3 ${isMarkingAsRead ? 'animate-pulse' : ''}`}
                                />
                              </Button>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={handleClose}
                                className='h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-800'
                                title='Cerrar'
                              >
                                <X className='h-3 w-3' />
                              </Button>
                            </div>
                          </div>

                          <p
                            className={`mb-2 text-sm break-words text-gray-700 dark:text-gray-300 ${!isExpanded ? 'line-clamp-2' : ''}`}
                          >
                            {notification.message}
                          </p>

                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => toggleExpanded(notification.id)}
                            className='h-6 px-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                          >
                            {isExpanded ? 'Ver menos' : 'Ver todo'}
                          </Button>
                        </div>

                        {index < notifications.length - 1 && (
                          <Separator className='my-2' />
                        )}
                      </div>
                    )
                  })}

                  {isFetchingMore && (
                    <div className='text-muted-foreground py-3 text-center text-xs'>
                      Cargando mas notificaciones...
                    </div>
                  )}

                  {!isFetchingMore && hasMore && (
                    <div className='py-2 text-center'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={handleLoadMore}
                        className='h-7 text-xs'
                      >
                        Cargar mas
                      </Button>
                    </div>
                  )}

                  {!hasMore && notifications.length > 0 && (
                    <div className='text-muted-foreground py-3 text-center text-xs'>
                      Fin de la lista ({totalItems} sin leer)
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
