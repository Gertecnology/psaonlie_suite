import { useNotifications } from '@/context/notifications-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

export function NotificationsTest() {
  const { notifications, unreadCount, isConnected, connectionError, markAsRead, removeNotification, clearAll } = useNotifications()

  const handleReconnect = () => {
    // El hook maneja la reconexión automáticamente
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test de Notificaciones</h1>
          <p className="text-muted-foreground">
            Estado de conexión WebSocket para notificaciones en tiempo real
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Wifi className="w-3 h-3 mr-1" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="w-3 h-3 mr-1" />
              Desconectado
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="w-5 h-5" />
              Estado de Conexión WebSocket
            </CardTitle>
            <CardDescription>
              {isConnected 
                ? 'Conectado al servidor de notificaciones en tiempo real'
                : 'Desconectado del servidor de notificaciones'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Estado:</span>
                {isConnected ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Desconectado
                  </Badge>
                )}
              </div>

              {connectionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {connectionError}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="font-medium">Endpoint:</span>
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                  ws://168.231.100.191:4001/notifications
                </code>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Notificaciones no leídas:</span>
                <Badge variant="secondary">
                  {unreadCount}
                </Badge>
              </div>

              {!isConnected && (
                <Button onClick={handleReconnect} className="w-fit">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconectar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Notificaciones Recientes</CardTitle>
                <CardDescription>
                  {notifications.length} notificaciones totales
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {unreadCount} sin leer
                    </Badge>
                  )}
                </CardDescription>
              </div>
              
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                  >
                    Limpiar todas
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay notificaciones</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <Badge variant="secondary" className="text-xs">
                              Nuevo
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Tipo: {notification.type}</span>
                          <span>Prioridad: {notification.priority}</span>
                          <span>
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-1 ml-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            ✓
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNotification(notification.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
