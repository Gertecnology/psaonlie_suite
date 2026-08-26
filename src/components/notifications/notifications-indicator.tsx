import { useState } from 'react'
import { Bell, Wifi, WifiOff } from 'lucide-react'
import { useNotifications } from '@/context/notifications-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { NotificationToast } from './notification-toast'

export function NotificationsIndicator() {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    removeNotification,
    clearAll,
  } = useNotifications()

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center p-0 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {!isConnected && (
            <div className='bg-destructive absolute -right-1 -bottom-1 h-2 w-2 rounded-full' />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-96 p-0' align='end'>
        <div className='border-b p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <h3 className='font-semibold'>Notificaciones</h3>
              {isConnected ? (
                <Badge variant='secondary' className='text-estado-ok text-xs'>
                  <Wifi className='mr-1 h-3 w-3' />
                  Conectado
                </Badge>
              ) : (
                <Badge variant='destructive' className='text-xs'>
                  <WifiOff className='mr-1 h-3 w-3' />
                  Desconectado
                </Badge>
              )}
            </div>

            {notifications.length > 0 && (
              <Button
                variant='outline'
                size='sm'
                onClick={clearAll}
                className='h-7 px-2 text-xs'
              >
                Limpiar todas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className='h-96'>
          {notifications.length === 0 ? (
            <div className='text-muted-foreground p-8 text-center'>
              <Bell className='mx-auto mb-2 h-8 w-8 opacity-50' />
              <p className='text-sm'>No hay notificaciones</p>
            </div>
          ) : (
            <div className='p-2'>
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <NotificationToast
                    notification={notification}
                    onClose={() => removeNotification(notification.id)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                  />
                  {index < notifications.length - 1 && (
                    <Separator className='my-2' />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
