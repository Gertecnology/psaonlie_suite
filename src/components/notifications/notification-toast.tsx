import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, Clock, User, CreditCard, Building2 } from 'lucide-react'
import { formatearGuaranies } from '@/lib/formato'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export interface NotificationData {
  id: string
  title: string
  message: string
  type: 'VENTA_PENDIENTE' | 'PAGO_CONFIRMADO' | 'SISTEMA' | 'PAGO_RECHAZADO'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  data: {
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
    agenciaId?: string
    empresaUrl?: string
    timestamp?: string
  }
  createdAt: string
  isRead: boolean
}

interface NotificationToastProps {
  notification: NotificationData
  onClose: () => void
  onMarkAsRead?: () => void
}

/**
 * El estado se comunica con ícono (color de la escala de estados) + texto del
 * título y la etiqueta de prioridad. Nunca solo con color.
 */
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'VENTA_PENDIENTE':
      return <Clock className='text-estado-atencion h-5 w-5' />
    case 'PAGO_CONFIRMADO':
      return <CreditCard className='text-estado-ok h-5 w-5' />
    case 'SISTEMA':
      return <Building2 className='text-estado-critico h-5 w-5' />
    case 'PAGO_RECHAZADO':
      return <CreditCard className='text-estado-critico h-5 w-5' />
    default:
      return <Clock className='text-muted-foreground h-5 w-5' />
  }
}

export function NotificationToast({
  notification,
  onClose,
  onMarkAsRead,
}: NotificationToastProps) {
  const formatCurrency = (amount: number) => {
    return formatearGuaranies(amount)
  }

  return (
    <Card className='w-96 shadow-lg'>
      <CardContent className='p-4'>
        <div className='mb-3 flex items-start justify-between'>
          <div className='flex items-center gap-2'>
            {getNotificationIcon(notification.type)}
            <h4 className='text-sm font-semibold'>{notification.title}</h4>
          </div>
          <div className='flex items-center gap-1'>
            <Badge variant='secondary' className='text-xs'>
              {notification.priority}
            </Badge>
            <Button
              variant='ghost'
              size='sm'
              onClick={onClose}
              className='hover:bg-accent h-6 w-6 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>

        <p className='text-foreground mb-3 text-sm'>{notification.message}</p>

        {/* Detalles específicos según el tipo */}
        {notification.type === 'VENTA_PENDIENTE' && (
          <div className='text-muted-foreground space-y-2 text-xs'>
            <div className='flex items-center gap-2'>
              <User className='h-3 w-3' />
              <span>{notification.data.clienteNombre}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Building2 className='h-3 w-3' />
              <span>{notification.data.empresaNombre}</span>
            </div>
            <div className='flex items-center gap-2'>
              <CreditCard className='h-3 w-3' />
              <span>
                {notification.data.metodoPago} -{' '}
                {formatCurrency(notification.data.importeTotal || 0)}
              </span>
            </div>
            <div className='text-muted-foreground text-xs'>
              Transacción: {notification.data.numeroTransaccion}
            </div>
          </div>
        )}

        {notification.type === 'PAGO_CONFIRMADO' && (
          <div className='text-muted-foreground space-y-2 text-xs'>
            <div className='flex items-center gap-2'>
              <User className='h-3 w-3' />
              <span>{notification.data.clienteNombre}</span>
            </div>
            <div className='flex items-center gap-2'>
              <Building2 className='h-3 w-3' />
              <span>{notification.data.empresaNombre}</span>
            </div>
            <div className='flex items-center gap-2'>
              <CreditCard className='h-3 w-3' />
              <span>
                {notification.data.metodoPago} -{' '}
                {formatCurrency(Number(notification.data.importeTotal) || 0)}
              </span>
            </div>
            {notification.data.authorizationNumber && (
              <div className='text-muted-foreground text-xs'>
                Auth: {notification.data.authorizationNumber}
              </div>
            )}
          </div>
        )}

        {notification.type === 'SISTEMA' && (
          <div className='text-muted-foreground space-y-2 text-xs'>
            <div className='flex items-center gap-2'>
              <Building2 className='h-3 w-3' />
              <span>{notification.data.empresaNombre}</span>
            </div>
            <div className='text-destructive text-xs'>
              Motivo: {notification.data.motivo}
            </div>
          </div>
        )}

        <div className='border-border mt-3 flex items-center justify-between border-t pt-2'>
          <span className='text-muted-foreground text-xs'>
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>

          {!notification.isRead && onMarkAsRead && (
            <Button
              variant='outline'
              size='sm'
              onClick={onMarkAsRead}
              className='h-6 px-2 text-xs'
            >
              Marcar como leída
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
