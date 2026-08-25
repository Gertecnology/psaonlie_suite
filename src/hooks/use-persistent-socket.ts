import { useCallback, useEffect, useState } from 'react'
import { socketService } from '@/utils/socket'

interface EstadoSocket {
  isConnected: boolean
  connectionError: string | null
  socketId: string | null
}

/**
 * React's view of the single socket.
 *
 * It used to poll `socketService.isConnected()` every ten seconds and mirror
 * the result into `sessionStorage`. Two problems: a socket already tells you
 * when it connects and disconnects, so polling only added up to ten seconds of
 * lag; and the poll's repair branch (`!isHealthy && actualConnected`) could
 * never run, because `isConnectionHealthy()` was `connected && !disconnected` —
 * the two halves are exact opposites in socket.io, so the condition was always
 * false. It looked like a safety net and was dead code.
 *
 * Now it subscribes to the socket's own events.
 */
export function usePersistentSocket() {
  const [estado, setEstado] = useState<EstadoSocket>(() => ({
    isConnected: socketService.isConnected(),
    connectionError: null,
    socketId: socketService.getSocket()?.id ?? null,
  }))

  useEffect(() => {
    const alConectar = () => {
      setEstado({
        isConnected: true,
        connectionError: null,
        socketId: socketService.getSocket()?.id ?? null,
      })
    }

    const alDesconectar = () => {
      setEstado((previo) => ({ ...previo, isConnected: false, socketId: null }))
    }

    const alFallar = (...args: unknown[]) => {
      const error = args[0]
      setEstado((previo) => ({
        ...previo,
        isConnected: false,
        connectionError:
          error instanceof Error ? error.message : 'Error de conexión',
      }))
    }

    socketService.addListener('connect', alConectar)
    socketService.addListener('disconnect', alDesconectar)
    socketService.addListener('connect_error', alFallar)

    return () => {
      socketService.removeListener('connect', alConectar)
      socketService.removeListener('disconnect', alDesconectar)
      socketService.removeListener('connect_error', alFallar)
    }
  }, [])

  const connectSocket = useCallback(async (accessToken: string) => {
    try {
      await socketService.connect(accessToken)
      return true
    } catch (error) {
      setEstado((previo) => ({
        ...previo,
        isConnected: false,
        connectionError:
          error instanceof Error ? error.message : 'Error desconocido',
      }))
      return false
    }
  }, [])

  const disconnectSocket = useCallback(() => {
    socketService.disconnect()
    setEstado({ isConnected: false, connectionError: null, socketId: null })
  }, [])

  return {
    ...estado,
    connectSocket,
    disconnectSocket,
    socket: socketService.getSocket(),
    addListener: socketService.addListener.bind(socketService),
    removeListener: socketService.removeListener.bind(socketService),
    emit: socketService.emit.bind(socketService),
    refreshToken: socketService.refreshToken.bind(socketService),
    ensureConnection: socketService.ensureConnection.bind(socketService),
    isConnectionHealthy: socketService.isConnectionHealthy.bind(socketService),
    forceReconnect: socketService.forceReconnect.bind(socketService),
  }
}
