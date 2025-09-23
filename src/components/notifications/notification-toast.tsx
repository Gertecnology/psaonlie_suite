import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Clock, User, CreditCard, Building2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

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
    empresaId?: string
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

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'VENTA_PENDIENTE':
      return <Clock className="w-5 h-5 text-yellow-600" />
    case 'PAGO_CONFIRMADO':
      return <CreditCard className="w-5 h-5 text-green-600" />
    case 'SISTEMA':
      return <Building2 className="w-5 h-5 text-red-600" />
    case 'PAGO_RECHAZADO':
      return <CreditCard className="w-5 h-5 text-red-600" />
    default:
      return <Clock className="w-5 h-5 text-blue-600" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-50 border-red-200'
    case 'MEDIUM':
      return 'bg-yellow-50 border-yellow-200'
    case 'LOW':
      return 'bg-blue-50 border-blue-200'
    default:
      return 'bg-gray-50 border-gray-200'
  }
}

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-100 text-red-800'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800'
    case 'LOW':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function NotificationToast({ notification, onClose, onMarkAsRead }: NotificationToastProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <Card className={`w-96 shadow-lg border-l-4 border-l-blue-500 ${getPriorityColor(notification.priority)}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {getNotificationIcon(notification.type)}
            <h4 className="font-semibold text-sm">{notification.title}</h4>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className={`text-xs ${getPriorityBadgeColor(notification.priority)}`}>
              {notification.priority}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-3">{notification.message}</p>

        {/* Detalles específicos según el tipo */}
        {notification.type === 'VENTA_PENDIENTE' && (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span>{notification.data.clienteNombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              <span>{notification.data.empresaNombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-3 h-3" />
              <span>{notification.data.metodoPago} - {formatCurrency(notification.data.importeTotal || 0)}</span>
            </div>
            <div className="text-xs text-gray-500">
              Transacción: {notification.data.numeroTransaccion}
            </div>
          </div>
        )}

        {notification.type === 'PAGO_CONFIRMADO' && (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3" />
              <span>{notification.data.clienteNombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              <span>{notification.data.empresaNombre}</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-3 h-3" />
              <span>{notification.data.metodoPago} - {formatCurrency(Number(notification.data.importeTotal) || 0)}</span>
            </div>
            {notification.data.authorizationNumber && (
              <div className="text-xs text-gray-500">
                Auth: {notification.data.authorizationNumber}
              </div>
            )}
          </div>
        )}

        {notification.type === 'SISTEMA' && (
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              <span>{notification.data.empresaNombre}</span>
            </div>
            <div className="text-xs text-red-600">
              Motivo: {notification.data.motivo}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: es
            })}
          </span>
          
          {!notification.isRead && onMarkAsRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMarkAsRead}
              className="h-6 px-2 text-xs"
            >
              Marcar como leída
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
