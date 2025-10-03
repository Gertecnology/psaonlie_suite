/* eslint-disable no-console */
import { useEffect, useState, useCallback } from 'react'
import { useSocket } from '@/utils/socket'
import { useAuth } from '@/context/auth-context'

export const useNotifications = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const { accessToken, isAuthenticated } = useAuth()
  const { connectSocket, disconnectSocket, socket, addListener } = useSocket()

  const handleNewNotification = useCallback((_data: unknown) => {
    // Aquí puedes agregar lógica adicional cuando llegue una notificación
    // Por ejemplo, mostrar un toast o actualizar algún estado
  }, [])

  const handleConnect = useCallback(() => {
    setIsConnected(true)
    setConnectionError(null)
  }, [])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
  }, [])

  const handleConnectError = useCallback((error: unknown) => {
    setIsConnected(false)
    setConnectionError(error instanceof Error ? error.message : 'Error desconocido')
    console.error('Error de conexión:', error)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    // Conectar cuando el usuario esté autenticado
    const initConnection = async () => {
      try {
        await connectSocket(accessToken)
      } catch (error) {
        console.error('Error al inicializar conexión:', error)
      }
    }

    initConnection()

    // Configurar listener para nuevas notificaciones
    addListener('new-notification', handleNewNotification)

    // Escuchar cambios de estado de conexión
    if (socket) {
      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('connect_error', handleConnectError)
    }

    return () => {
      if (socket) {
        socket.off('connect', handleConnect)
        socket.off('disconnect', handleDisconnect)
        socket.off('connect_error', handleConnectError)
      }
      disconnectSocket()
    }
  }, [isAuthenticated, accessToken, connectSocket, disconnectSocket, addListener, socket, handleNewNotification, handleConnect, handleDisconnect, handleConnectError])

  return {
    isConnected,
    connectionError,
    socket
  }
}