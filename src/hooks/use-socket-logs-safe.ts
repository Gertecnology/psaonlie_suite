/* eslint-disable no-console */
import { useEffect, useState, useCallback } from 'react'
import { socketService } from '@/utils/socket'

interface LogEntry {
  timestamp: string
  message: string
  type: 'log' | 'error' | 'info'
}

export function useSocketLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = useCallback((message: string, type: 'log' | 'error' | 'info' = 'info') => {
    const newLog: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }
    
    setLogs(prev => {
      // Evitar duplicados y mantener solo los últimos 15 logs
      const filtered = prev.filter(log => 
        log.message !== newLog.message || log.timestamp !== newLog.timestamp
      )
      return [...filtered.slice(-14), newLog]
    })
  }, [])

  useEffect(() => {
    const socket = socketService.getSocket()
    
    if (!socket) return

    // Escuchar eventos específicos del socket
    const handleConnect = () => {
      addLog(`Socket conectado: ${socket.id}`, 'log')
    }

    const handleDisconnect = (reason: string) => {
      addLog(`Socket desconectado: ${reason}`, 'error')
    }

    const handleConnectError = (error: unknown) => {
      addLog(`Error de conexión: ${error}`, 'error')
    }

    const handleError = (error: unknown) => {
      addLog(`Error Socket: ${JSON.stringify(error)}`, 'error')
    }

    const handleNewNotification = (data: unknown) => {
      addLog(`Nueva notificación recibida: ${JSON.stringify(data)}`, 'info')
    }

    // Agregar listeners
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('error', handleError)
    socket.on('new-notification', handleNewNotification)

    // Agregar log inicial
    if (socket.connected) {
      addLog(`Socket ya conectado: ${socket.id}`, 'log')
    } else {
      addLog('Socket no conectado', 'error')
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('error', handleError)
      socket.off('new-notification', handleNewNotification)
    }
  }, [addLog])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return {
    logs,
    clearLogs,
    addLog // Exponer para uso manual si es necesario
  }
}
