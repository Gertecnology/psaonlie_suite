/* eslint-disable no-console */
import { useEffect, useState, useCallback, useRef } from 'react'
import { socketService } from '@/utils/socket'

interface SocketState {
  isConnected: boolean
  connectionError: string | null
  socketId: string | null
}

const SOCKET_STATE_KEY = 'socket_connection_state'

export function usePersistentSocket() {
  const hasInitializedRef = useRef(false)
  
  const [socketState, setSocketState] = useState<SocketState>(() => {
    // Verificar el estado real del socket primero
    const actualConnected = socketService.isConnected()
    const actualSocketId = socketService.getSocket()?.id || null
    
    // Si el socket está realmente conectado, usar ese estado
    if (actualConnected && actualSocketId) {
      return {
        isConnected: actualConnected,
        connectionError: null,
        socketId: actualSocketId
      }
    }
    
    // Si no está conectado, no usar sessionStorage para evitar estados incorrectos
    return {
      isConnected: false,
      connectionError: null,
      socketId: null
    }
  })

  // Guardar estado en sessionStorage cuando cambie (solo si está conectado)
  useEffect(() => {
    try {
      if (socketState.isConnected) {
        sessionStorage.setItem(SOCKET_STATE_KEY, JSON.stringify(socketState))
      } else {
        // Si no está conectado, limpiar el sessionStorage
        sessionStorage.removeItem(SOCKET_STATE_KEY)
      }
    } catch (error) {
      console.error('Error al guardar estado del socket:', error)
    }
  }, [socketState])

  const updateConnectionState = useCallback((isConnected: boolean, error: string | null = null) => {
    setSocketState(prev => ({
      ...prev,
      isConnected,
      connectionError: error,
      socketId: isConnected ? socketService.getSocket()?.id || null : null
    }))
  }, [])

  const connectSocket = useCallback(async (accessToken: string) => {
    try {
      await socketService.connect(accessToken)
      updateConnectionState(true)
      return true
    } catch (error) {
      console.error('Error al conectar socket persistente:', error)
      updateConnectionState(false, error instanceof Error ? error.message : 'Error desconocido')
      return false
    }
  }, [updateConnectionState])

  const disconnectSocket = useCallback(() => {
    socketService.disconnect()
    updateConnectionState(false)
  }, [updateConnectionState])


  // Sincronizar estado al montar el hook
  useEffect(() => {
    if (hasInitializedRef.current) return
    
    hasInitializedRef.current = true
    
    const actualConnected = socketService.isConnected()
    const actualSocketId = socketService.getSocket()?.id || null
    
    // Si el estado real es diferente al estado actual, sincronizar
    setSocketState(prev => {
      if (actualConnected !== prev.isConnected || actualSocketId !== prev.socketId) {
        
        return {
          ...prev,
          isConnected: actualConnected,
          socketId: actualSocketId,
          connectionError: actualConnected ? null : prev.connectionError
        }
      }
      return prev
    })
  }, []) // Solo al montar

  // Verificar estado real del socket periódicamente
  useEffect(() => {
    const checkConnection = () => {
      const actualConnected = socketService.isConnected()
      const actualSocketId = socketService.getSocket()?.id || null
      const isHealthy = socketService.isConnectionHealthy()
      
      setSocketState(prev => {
        // Solo actualizar si hay cambios reales o la conexión no está saludable
        if (actualConnected !== prev.isConnected || actualSocketId !== prev.socketId || !isHealthy) {
          
          // Si la conexión no está saludable pero debería estar conectada, intentar reconectar
          if (!isHealthy && actualConnected) {
            socketService.ensureConnection().catch(error => {
              console.error('Error al verificar conexión:', error)
            })
          }
          
          return {
            ...prev,
            isConnected: actualConnected && isHealthy,
            socketId: actualSocketId,
            connectionError: (actualConnected && isHealthy) ? null : prev.connectionError
          }
        }
        return prev // No hay cambios, devolver el estado anterior
      })
    }

    // Verificar cada 10 segundos (menos frecuente para evitar spam)
    const interval = setInterval(checkConnection, 10000)

    return () => clearInterval(interval)
  }, []) // Sin dependencias para evitar bucles infinitos

  return {
    ...socketState,
    connectSocket,
    disconnectSocket,
    socket: socketService.getSocket(),
    addListener: socketService.addListener.bind(socketService),
    removeListener: socketService.removeListener.bind(socketService),
    emit: socketService.emit.bind(socketService),
    refreshToken: socketService.refreshToken.bind(socketService),
    keepAlive: socketService.keepAlive.bind(socketService),
    ensureConnection: socketService.ensureConnection.bind(socketService),
    isConnectionHealthy: socketService.isConnectionHealthy.bind(socketService),
    forceReconnect: socketService.forceReconnect.bind(socketService)
  }
}
