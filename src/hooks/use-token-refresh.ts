/* eslint-disable no-console */
import { useEffect, useRef, useCallback } from 'react'
import { refreshToken, RefreshTokenResponse } from '@/services/auth'

interface UseTokenRefreshOptions {
  refreshInterval?: number // en milisegundos, por defecto 14 minutos
  onRefreshSuccess?: (data: RefreshTokenResponse) => void
  onRefreshError?: (error: Error) => void
}

export const useTokenRefresh = (options: UseTokenRefreshOptions = {}) => {
  const {
    refreshInterval = 14 * 60 * 1000, // 14 minutos por defecto
    onRefreshSuccess,
    onRefreshError,
  } = options

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

  const updateTokens = useCallback((data: RefreshTokenResponse) => {
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('user', JSON.stringify(data.user))
  }, [])

  const performRefresh = useCallback(async () => {
    const storedRefreshToken = localStorage.getItem('refreshToken')
    
    if (!storedRefreshToken || isRefreshingRef.current) {
      return
    }

    try {
      isRefreshingRef.current = true
      const data = await refreshToken(storedRefreshToken)
      
      updateTokens(data)
      onRefreshSuccess?.(data)
      
      console.log('Token renovado exitosamente')
    } catch (error) {
      console.error('Error al renovar token:', error)
      
      // Si el refresh token es inválido, limpiar todo y redirigir al login
      if (error instanceof Error && error.message.includes('Refresh token inválido')) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        
        // Opcional: redirigir al login
        window.location.href = '/login'
      }
      
      onRefreshError?.(error as Error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [updateTokens, onRefreshSuccess, onRefreshError])

  const startRefreshInterval = useCallback(() => {
    // Limpiar intervalo anterior si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Verificar que tenemos un refresh token
    const storedRefreshToken = localStorage.getItem('refreshToken')
    if (!storedRefreshToken) {
      return
    }

    // Configurar nuevo intervalo
    intervalRef.current = setInterval(performRefresh, refreshInterval)
    
    console.log(`Refresh token configurado para renovar cada ${refreshInterval / 60000} minutos`)
  }, [performRefresh, refreshInterval])

  const stopRefreshInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      console.log('Refresh token interval detenido')
    }
  }, [])

  const manualRefresh = useCallback(() => {
    return performRefresh()
  }, [performRefresh])

  // Iniciar el intervalo cuando el hook se monta
  useEffect(() => {
    startRefreshInterval()

    // Limpiar intervalo cuando el componente se desmonta
    return () => {
      stopRefreshInterval()
    }
  }, [startRefreshInterval, stopRefreshInterval])

  // Reiniciar el intervalo cuando cambie el refresh token
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'refreshToken' && e.newValue) {
        startRefreshInterval()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [startRefreshInterval])

  return {
    manualRefresh,
    startRefreshInterval,
    stopRefreshInterval,
    isRefreshing: isRefreshingRef.current,
  }
}
