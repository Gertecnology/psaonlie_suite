import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  MoreHorizontal, 
  ShoppingCart, 
  Trash2, 
  XCircle 
} from 'lucide-react'
import { type NotificationResponse } from '@/services/notifications'

interface NotificationData {
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

interface NotificationsColumnsProps {
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
}

export function createNotificationsColumns({ 
  onMarkAsRead, 
  onDelete 
}: NotificationsColumnsProps): ColumnDef<NotificationResponse>[] {
  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todas las notificaciones"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar notificación"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue('type') as string
        const getTypeIcon = (type: string) => {
          switch (type) {
            case 'VENTA_NUEVA':
              return <ShoppingCart className="h-4 w-4" />
            case 'VENTA_PENDIENTE':
              return <Clock className="h-4 w-4" />
            case 'PAGO_CONFIRMADO':
              return <CheckCircle className="h-4 w-4" />
            case 'PAGO_RECHAZADO':
              return <XCircle className="h-4 w-4" />
            case 'SISTEMA':
              return <Bell className="h-4 w-4" />
            default:
              return <Bell className="h-4 w-4" />
          }
        }

        const getTypeLabel = (type: string) => {
          switch (type) {
            case 'VENTA_NUEVA':
              return 'Venta Nueva'
            case 'VENTA_PENDIENTE':
              return 'Venta Pendiente'
            case 'PAGO_CONFIRMADO':
              return 'Pago Confirmado'
            case 'PAGO_RECHAZADO':
              return 'Pago Rechazado'
            case 'SISTEMA':
              return 'Sistema'
            default:
              return type
          }
        }

        const getTypeVariant = (type: string) => {
          switch (type) {
            case 'VENTA_NUEVA':
              return 'default'
            case 'VENTA_PENDIENTE':
              return 'secondary'
            case 'PAGO_CONFIRMADO':
              return 'default'
            case 'PAGO_RECHAZADO':
              return 'destructive'
            case 'SISTEMA':
              return 'outline'
            default:
              return 'outline'
          }
        }

        return (
          <div className="flex items-center gap-2">
            {getTypeIcon(type)}
            <Badge variant={getTypeVariant(type) as "default" | "secondary" | "destructive" | "outline"}>
              {getTypeLabel(type)}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'priority',
      header: 'Prioridad',
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string
        const getPriorityVariant = (priority: string) => {
          switch (priority) {
            case 'URGENT':
              return 'destructive'
            case 'HIGH':
              return 'default'
            case 'MEDIUM':
              return 'secondary'
            case 'LOW':
              return 'outline'
            default:
              return 'outline'
          }
        }

        const getPriorityLabel = (priority: string) => {
          switch (priority) {
            case 'URGENT':
              return 'Urgente'
            case 'HIGH':
              return 'Alta'
            case 'MEDIUM':
              return 'Media'
            case 'LOW':
              return 'Baja'
            default:
              return priority
          }
        }

        return (
          <Badge variant={getPriorityVariant(priority) as "default" | "secondary" | "destructive" | "outline"}>
            {getPriorityLabel(priority)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'title',
      header: 'Título',
      cell: ({ row }) => {
        const notification = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">{notification.title}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'data',
      header: 'Detalles',
      cell: ({ row }) => {
        const data = row.getValue('data') as NotificationData
        const notification = row.original
        
        if (notification.type === 'VENTA_NUEVA' || notification.type === 'VENTA_PENDIENTE') {
          return (
            <div className="space-y-1 text-sm">
              {data.empresaNombre && (
                <div><strong>Empresa:</strong> {data.empresaNombre}</div>
              )}
              {data.numeroTransaccion && (
                <div><strong>Transacción:</strong> {data.numeroTransaccion}</div>
              )}
              {data.monto && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>{new Intl.NumberFormat('es-PY', {
                    style: 'currency',
                    currency: 'PYG',
                    minimumFractionDigits: 0
                  }).format(data.monto)}</span>
                </div>
              )}
            </div>
          )
        }

        if (notification.type === 'PAGO_CONFIRMADO' || notification.type === 'PAGO_RECHAZADO') {
          return (
            <div className="space-y-1 text-sm">
              {data.numeroTransaccion && (
                <div><strong>Transacción:</strong> {data.numeroTransaccion}</div>
              )}
              {data.monto && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  <span>{new Intl.NumberFormat('es-PY', {
                    style: 'currency',
                    currency: 'PYG',
                    minimumFractionDigits: 0
                  }).format(data.monto)}</span>
                </div>
              )}
              {data.motivo && (
                <div><strong>Motivo:</strong> {data.motivo}</div>
              )}
            </div>
          )
        }

        return (
          <div className="text-sm text-muted-foreground">
            {data.observaciones || 'Sin detalles adicionales'}
          </div>
        )
      },
    },
    {
      accessorKey: 'isRead',
      header: 'Estado',
      cell: ({ row }) => {
        const isRead = row.getValue('isRead') as boolean
        return (
          <div className="flex items-center gap-2">
            {isRead ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">Leída</span>
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-600">No leída</span>
              </>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'))
        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString('es-PY')}</div>
            <div className="text-muted-foreground">{date.toLocaleTimeString('es-PY', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</div>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Acciones',
      cell: ({ row }) => {
        const notification = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.isRead && (
                <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Marcar como leída
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={() => onDelete(notification.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
