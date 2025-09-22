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
      console.log('Socket realmente conectado, usando estado real:', { 
        isConnected: actualConnected, 
        socketId: actualSocketId 
      })
      return {
        isConnected: actualConnected,
        connectionError: null,
        socketId: actualSocketId
      }
    }
    
    // Si no está conectado, intentar recuperar desde sessionStorage
    try {
      const saved = sessionStorage.getItem(SOCKET_STATE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        console.log('Estado del socket recuperado desde sessionStorage:', parsed)
        return parsed
      }
    } catch (error) {
      console.error('Error al recuperar estado del socket:', error)
    }
    
    return {
      isConnected: false,
      connectionError: null,
      socketId: null
    }
  })

  // Guardar estado en sessionStorage cuando cambie
  useEffect(() => {
    try {
      sessionStorage.setItem(SOCKET_STATE_KEY, JSON.stringify(socketState))
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
      console.log('Intentando conectar socket persistente...')
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
    console.log('Desconectando socket persistente...')
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
        console.log('Sincronizando estado del socket al montar:', { 
          actualConnected, 
          actualSocketId,
          currentState: prev
        })
        
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
      
      setSocketState(prev => {
        // Solo actualizar si hay cambios reales
        if (actualConnected !== prev.isConnected || actualSocketId !== prev.socketId) {
          console.log('Estado del socket actualizado:', { 
            isConnected: actualConnected, 
            socketId: actualSocketId 
          })
          return {
            ...prev,
            isConnected: actualConnected,
            socketId: actualSocketId,
            connectionError: actualConnected ? null : prev.connectionError
          }
        }
        return prev // No hay cambios, devolver el estado anterior
      })
    }

    // Verificar cada 5 segundos
    const interval = setInterval(checkConnection, 5000)

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
    refreshToken: socketService.refreshToken.bind(socketService)
  }
}
