/* eslint-disable no-console */
import { useNotifications } from '@/context/notifications-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, TestTube, Database } from 'lucide-react'
import { usePersistentSocket } from '@/hooks/use-persistent-socket'
import { useNotificationsApi } from '@/hooks/use-notifications-api'

export function NotificationsTest() {
  const { notifications, unreadCount, isConnected, connectionError, markAsRead, removeNotification, clearAll, reconnect, forceReconnect: contextForceReconnect } = useNotifications()
  const { ensureConnection, forceReconnect, isConnectionHealthy, keepAlive } = usePersistentSocket()
  
  // Hook directo de la API para pruebas
  const {
    unreadCount: apiUnreadCount,
    notifications: apiNotifications,
    isLoading: apiLoading,
    error: apiError,
    refreshUnreadCount,
    refreshNotifications,
    markAsRead: apiMarkAsRead,
    markAllAsRead: apiMarkAllAsRead,
    clearError
  } = useNotificationsApi()

  const handleReconnect = async () => {
    console.log('Iniciando reconexión manual...')
    await reconnect()
  }

  const handleForceReconnect = async () => {
    console.log('Iniciando reconexión forzada...')
    const success = await forceReconnect()
    if (success) {
      console.log('Reconexión forzada exitosa')
    } else {
      console.error('Reconexión forzada falló')
    }
  }

  const handleContextForceReconnect = async () => {
    console.log('Iniciando reconexión forzada desde contexto...')
    await contextForceReconnect()
  }

  const handleEnsureConnection = async () => {
    console.log('Verificando conexión...')
    const success = await ensureConnection()
    if (success) {
      console.log('Conexión verificada exitosamente')
    } else {
      console.error('No se pudo verificar la conexión')
    }
  }

  const handleKeepAlive = () => {
    console.log('Enviando ping para mantener conexión activa...')
    keepAlive()
  }

  const handleTestNotification = () => {
    // Simular una notificación de prueba
    const testNotification = {
      id: `test-${Date.now()}`,
      title: 'Notificación de Prueba',
      message: 'Esta es una notificación de prueba para verificar el flujo',
      type: 'SISTEMA' as const,
      priority: 'MEDIUM' as const,
      data: {
        empresaNombre: 'Sistema de Pruebas',
        motivo: 'Prueba de notificaciones'
      },
      createdAt: new Date().toISOString(),
      isRead: false
    }
    
    // Agregar directamente a las notificaciones para probar
    console.log('Agregando notificación de prueba:', testNotification)
    // Esto simularía lo que haría el socket
  }

  const handleRefreshApiData = async () => {
    console.log('Actualizando datos de la API...')
    await Promise.all([
      refreshUnreadCount(),
      refreshNotifications()
    ])
  }

  const handleTestApiMarkAsRead = async () => {
    if (apiNotifications.length > 0) {
      const firstNotification = apiNotifications[0]
      console.log('Probando marcar como leída desde API:', firstNotification.id)
      await apiMarkAsRead(firstNotification.id)
    } else {
      console.log('No hay notificaciones para probar')
    }
  }

  const handleTestApiMarkAllAsRead = async () => {
    console.log('Probando marcar todas como leídas desde API...')
    await apiMarkAllAsRead()
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
                <span className="font-medium">Notificaciones no leídas (Contexto):</span>
                <Badge variant="secondary">
                  {unreadCount}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Notificaciones no leídas (API):</span>
                <Badge variant="secondary">
                  {apiUnreadCount}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Conexión saludable:</span>
                {isConnectionHealthy() ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Sí
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    No
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Estado API:</span>
                {apiLoading ? (
                  <Badge variant="secondary">
                    Cargando...
                  </Badge>
                ) : apiError ? (
                  <Badge variant="destructive">
                    Error: {apiError}
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    OK
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {!isConnected && (
                  <Button onClick={handleReconnect} className="w-fit">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reconectar
                  </Button>
                )}
                
                <Button onClick={handleForceReconnect} variant="outline" className="w-fit">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Forzar Reconexión
                </Button>
                
                <Button onClick={handleContextForceReconnect} variant="outline" className="w-fit">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Forzar Reconexión (Contexto)
                </Button>
                
                <Button onClick={handleEnsureConnection} variant="outline" className="w-fit">
                  <Wifi className="w-4 h-4 mr-2" />
                  Verificar Conexión
                </Button>
                
                <Button onClick={handleKeepAlive} variant="outline" className="w-fit">
                  <TestTube className="w-4 h-4 mr-2" />
                  Ping
                </Button>
                
                <Button onClick={handleTestNotification} variant="outline" className="w-fit">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Notificación
                </Button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button onClick={handleRefreshApiData} variant="outline" className="w-fit">
                  <Database className="w-4 h-4 mr-2" />
                  Actualizar API
                </Button>
                
                <Button onClick={handleTestApiMarkAsRead} variant="outline" className="w-fit">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Marcar Leída
                </Button>
                
                <Button onClick={handleTestApiMarkAllAsRead} variant="outline" className="w-fit">
                  <TestTube className="w-4 h-4 mr-2" />
                  Test Marcar Todas
                </Button>
                
                {apiError && (
                  <Button onClick={clearError} variant="outline" className="w-fit">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Limpiar Error
                  </Button>
                )}
              </div>
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
