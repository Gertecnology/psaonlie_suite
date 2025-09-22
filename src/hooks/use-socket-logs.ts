/* eslint-disable no-console */
import { useEffect, useState, useRef, useCallback } from 'react'

interface LogEntry {
  timestamp: string
  message: string
  type: 'log' | 'error'
}

export function useSocketLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const originalLogRef = useRef<typeof console.log | undefined>(undefined)
  const originalErrorRef = useRef<typeof console.error | undefined>(undefined)
  const isInterceptedRef = useRef(false)
  const isUpdatingRef = useRef(false)

  const addLog = useCallback((message: string, type: 'log' | 'error') => {
    if (isUpdatingRef.current) return // Evitar bucles infinitos
    
    isUpdatingRef.current = true
    
    setLogs(prev => {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        message,
        type
      }
      
      // Evitar duplicados y mantener solo los últimos 10 logs
      const filtered = prev.filter(log => 
        log.message !== newLog.message || log.timestamp !== newLog.timestamp
      )
      return [...filtered.slice(-9), newLog]
    })
    
    // Resetear el flag después de un pequeño delay
    setTimeout(() => {
      isUpdatingRef.current = false
    }, 10)
  }, [])

  useEffect(() => {
    // Solo interceptar una vez
    if (isInterceptedRef.current) return

    originalLogRef.current = console.log
    originalErrorRef.current = console.error
    isInterceptedRef.current = true

    const logInterceptor = (...args: unknown[]) => {
      const message = args.join(' ')
      if (message.includes('Socket') || message.includes('WebSocket')) {
        addLog(message, 'log')
      }
      originalLogRef.current?.(...args)
    }

    const errorInterceptor = (...args: unknown[]) => {
      const message = args.join(' ')
      if (message.includes('Socket') || message.includes('WebSocket')) {
        addLog(message, 'error')
      }
      originalErrorRef.current?.(...args)
    }

    console.log = logInterceptor
    console.error = errorInterceptor

    return () => {
      if (originalLogRef.current) {
        console.log = originalLogRef.current
      }
      if (originalErrorRef.current) {
        console.error = originalErrorRef.current
      }
      isInterceptedRef.current = false
    }
  }, [addLog])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return {
    logs,
    clearLogs
  }
}
