/* eslint-disable no-console */
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wifi, WifiOff, RefreshCw, Activity } from 'lucide-react'
import { useNotifications } from '@/context/notifications-context'
import { socketService } from '@/utils/socket'
import { useSocketLogs } from '@/hooks/use-socket-logs-safe'

interface LogEntry {
  timestamp: string
  message: string
  type: 'log' | 'error' | 'info'
}

export function SocketStatusMonitor() {
  const { isConnected, connectionError, refreshToken, reconnect } = useNotifications()
  const { logs, clearLogs } = useSocketLogs()
  const [tokenInfo, setTokenInfo] = useState<{expiry?: number, isValid?: boolean}>({})

  const handleReconnect = async () => {
    try {
      console.log('Reconexión manual iniciada desde monitor...')
      await reconnect()
      console.log('Reconexión manual completada desde monitor')
    } catch (error) {
      console.error('Error en reconexión manual desde monitor:', error)
    }
  }

  const handleRefreshToken = async () => {
    try {
      console.log('Refrescando token manualmente...')
      const success = await refreshToken()
      if (success) {
        console.log('Token refrescado exitosamente')
        setTokenInfo(prev => ({ ...prev, isValid: true }))
      } else {
        console.error('Error al refrescar token')
        setTokenInfo(prev => ({ ...prev, isValid: false }))
      }
    } catch (error) {
      console.error('Error al refrescar token:', error)
      setTokenInfo(prev => ({ ...prev, isValid: false }))
    }
  }

  const analyzeToken = useCallback(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      setTokenInfo({ isValid: false })
      return
    }

    try {
      // Decodificar JWT (solo el payload, sin verificar firma)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiry = payload.exp * 1000 // Convertir a milisegundos
      const now = Date.now()
      const isValid = expiry > now
      
      setTokenInfo({ expiry, isValid })
      
      console.log('Token analizado:', {
        expiry: new Date(expiry).toLocaleString(),
        isValid,
        timeLeft: Math.max(0, expiry - now)
      })
    } catch (error) {
      console.error('Error al analizar token:', error)
      setTokenInfo({ isValid: false })
    }
  }, [])

  useEffect(() => {
    analyzeToken()
    const interval = setInterval(analyzeToken, 30000) // Verificar cada 30 segundos
    return () => clearInterval(interval)
  }, [analyzeToken])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitor de Socket</h1>
          <p className="text-muted-foreground">
            Estado en tiempo real de la conexión WebSocket
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
              <Activity className="w-5 h-5" />
              Estado Actual
            </CardTitle>
            <CardDescription>
              Información en tiempo real de la conexión
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

              <div className="flex items-center gap-2">
                <span className="font-medium">Socket ID:</span>
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                  {socketService.getSocket()?.id || 'No conectado'}
                </code>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Endpoint:</span>
                <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                  ws://168.231.100.191:4001/notifications
                </code>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-medium">Token JWT:</span>
                {tokenInfo.isValid ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    Válido
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    Expirado/Inválido
                  </Badge>
                )}
              </div>

              {tokenInfo.expiry && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Expira:</span>
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {new Date(tokenInfo.expiry).toLocaleString()}
                  </code>
                </div>
              )}

              {connectionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>Error:</strong> {connectionError}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleReconnect} className="w-fit">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconectar
                </Button>
                <Button onClick={handleRefreshToken} variant="outline" className="w-fit">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refrescar Token
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Logs de Conexión</CardTitle>
                <CardDescription>
                  Historial de eventos del WebSocket
                </CardDescription>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={clearLogs}
              >
                Limpiar logs
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="h-64 overflow-y-auto bg-gray-50 rounded-md p-4">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay logs de conexión aún
                </p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log: LogEntry, index: number) => (
                    <div key={index} className={`text-xs font-mono ${log.type === 'error' ? 'text-red-600' : 'text-gray-700'}`}>
                      <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
