/* eslint-disable no-console */
import { useEffect, useRef } from 'react'
import { socketService } from '@/utils/socket'

export function useTokenMonitor() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('accessToken')
      if (!token) return

      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const expiry = payload.exp * 1000
        const now = Date.now()
        const timeLeft = expiry - now
        
        console.log('Token check:', {
          expiry: new Date(expiry).toLocaleString(),
          timeLeft: Math.round(timeLeft / 1000 / 60), // minutos
          isExpired: timeLeft <= 0,
          isNearExpiry: timeLeft < 5 * 60 * 1000 // 5 minutos
        })

        // Si el token está expirado o próximo a expirar, refrescarlo
        if (timeLeft <= 0 || timeLeft < 5 * 60 * 1000) {
          console.log('Token expirado o próximo a expirar, refrescando...')
          const success = await socketService.refreshToken()
          if (success) {
            console.log('Token refrescado exitosamente')
          } else {
            console.error('Error al refrescar token')
          }
        }
      } catch (error) {
        console.error('Error al verificar token:', error)
      }
    }

    // Verificar inmediatamente
    checkToken()

    // Verificar cada 2 minutos
    intervalRef.current = setInterval(checkToken, 2 * 60 * 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    refreshToken: socketService.refreshToken.bind(socketService)
  }
}
