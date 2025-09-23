/* eslint-disable no-console */
import { io, Socket } from 'socket.io-client'
import { refreshToken } from '@/services/auth'

const API_URL = "ws://168.231.100.191:4001/notifications"

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private connectionPromise: Promise<Socket> | null = null
  private listeners: Map<string, (...args: unknown[]) => void> = new Map()

  connect(accessToken: string): Promise<Socket> {
    // Si ya hay una conexión activa, devolverla
    if (this.socket?.connected) {
      console.log('Socket ya conectado, reutilizando conexión existente')
      return Promise.resolve(this.socket)
    }

    // Si hay una conexión en progreso, devolver la promesa existente
    if (this.isConnecting && this.connectionPromise) {
      console.log('Conexión en progreso, esperando...')
      return this.connectionPromise
    }

    // Resetear intentos de reconexión al conectar manualmente
    this.reconnectAttempts = 0
    this.isConnecting = true
    this.connectionPromise = new Promise((resolve, reject) => {
      const initializeConnection = async () => {
        console.log('Intentando conectar con token:', accessToken ? 'Token presente' : 'Sin token')

        // Verificar si el token está próximo a expirar antes de conectar
        const tokenValid = await this.checkAndRefreshToken()
        if (!tokenValid) {
          console.error('No se pudo refrescar el token antes de conectar')
          this.isConnecting = false
          this.connectionPromise = null
          reject(new Error('Token inválido'))
          return
        }

        // Usar el token actualizado del localStorage
        const currentToken = localStorage.getItem('accessToken') || accessToken

        this.socket = io(API_URL, {
          auth: {
            token: currentToken
          },
          extraHeaders: {
            Authorization: currentToken
          },
          withCredentials: true,
          transports: ['websocket'],
          timeout: 20000,
          forceNew: true
        })

      this.socket.on('connect', () => {
        console.log('Socket conectado:', this.socket?.id)
        this.reconnectAttempts = 0
        this.isConnecting = false
        
        // Re-aplicar listeners guardados
        this.reapplyListeners()
        
        resolve(this.socket!)
      })

      this.socket.on('connect_error', (error) => {
        console.error('Error de conexión Socket:', error)
        this.isConnecting = false
        this.connectionPromise = null
        reject(error)
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Socket desconectado:', reason)
        this.isConnecting = false
        this.connectionPromise = null
        
        // Solo reconectar si no fue una desconexión intencional
        if (reason !== 'io client disconnect' && reason !== 'io server disconnect') {
          console.log('Iniciando reconexión automática por desconexión inesperada')
          this.handleReconnect()
        } else {
          console.log('Desconexión intencional, no reconectando automáticamente')
        }
      })

      this.socket.on('error', async (error) => {
        console.error('Error Socket:', error)
        
        // Si el error es de JWT expirado, intentar refrescar el token
        if (error && typeof error === 'object' && 'details' in error && error.details === 'jwt expired') {
          console.log('JWT expirado detectado en error handler, intentando refrescar token...')
          const refreshed = await this.refreshTokenAndReconnect()
          if (!refreshed) {
            console.error('No se pudo refrescar el token, desconectando socket')
            this.socket?.disconnect()
          }
        }
      })

      // También escuchar eventos de autenticación específicos
      this.socket.on('auth_error', async (error) => {
        console.error('Auth Error Socket:', error)
        
        if (error && typeof error === 'object' && 'details' in error && error.details === 'jwt expired') {
          console.log('JWT expirado detectado en auth_error handler, intentando refrescar token...')
          const refreshed = await this.refreshTokenAndReconnect()
          if (!refreshed) {
            console.error('No se pudo refrescar el token, desconectando socket')
            this.socket?.disconnect()
          }
        }
      })

      // Escuchar cualquier evento que pueda contener errores de autenticación
      this.socket.onAny((eventName, ...args) => {
        if (eventName.includes('error') || eventName.includes('auth')) {
          console.log(`Evento ${eventName}:`, args)
          
          // Buscar errores de JWT en cualquier argumento
          for (const arg of args) {
            if (arg && typeof arg === 'object' && 'details' in arg && arg.details === 'jwt expired') {
              console.log('JWT expirado detectado en evento personalizado, intentando refrescar token...')
              this.refreshTokenAndReconnect()
              break
            }
          }
        }
      })
      }
      
      // Ejecutar la inicialización
      initializeConnection()
    })

    return this.connectionPromise
  }

  // Método para agregar listeners de forma persistente
  addListener(event: string, callback: (...args: unknown[]) => void) {
    this.listeners.set(event, callback)
    
    // Si el socket ya está conectado, aplicar inmediatamente
    if (this.socket?.connected) {
      this.socket.on(event, callback)
    }
  }

  // Método para remover listeners
  removeListener(event: string, callback?: (...args: unknown[]) => void) {
    this.listeners.delete(event)
    
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback)
      } else {
        this.socket.off(event)
      }
    }
  }

  // Re-aplicar todos los listeners guardados
  private reapplyListeners() {
    if (this.socket) {
      this.listeners.forEach((callback, event) => {
        this.socket!.on(event, callback)
      })
    }
  }

  // Método para refrescar el token y reconectar
  private async refreshTokenAndReconnect() {
    try {
      console.log('Intentando refrescar token para reconectar socket...')
      const storedRefreshToken = localStorage.getItem('refreshToken')
      
      if (!storedRefreshToken) {
        console.error('No hay refresh token disponible')
        return false
      }

      const data = await refreshToken(storedRefreshToken)
      
      // Actualizar tokens en localStorage
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      console.log('Token refrescado exitosamente, reconectando socket...')
      
      // Desconectar socket actual
      if (this.socket) {
        this.socket.disconnect()
        this.socket = null
      }
      
      // Reconectar con nuevo token
      await this.connect(data.accessToken)
      return true
    } catch (error) {
      console.error('Error al refrescar token:', error)
      return false
    }
  }

  private async handleReconnect() {
    // No reconectar si ya estamos conectados
    if (this.socket?.connected) {
      console.log('Socket ya está conectado, saltando reconexión')
      return
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      console.log(`Programando reconexión en ${delay}ms (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(async () => {
        // Verificar nuevamente antes de reconectar
        if (this.socket?.connected) {
          console.log('Socket conectado durante el delay, cancelando reconexión')
          return
        }

        console.log(`Intentando reconectar Socket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        
        try {
          // Intentar refrescar el token primero
          const tokenRefreshed = await this.refreshTokenAndReconnect()
          
          if (!tokenRefreshed) {
            // Si no se pudo refrescar, usar el token actual
            const token = localStorage.getItem('accessToken')
            if (token) {
              console.log('Usando token actual para reconexión')
              await this.connect(token)
            } else {
              console.error('No hay token disponible para reconectar')
              // Resetear intentos para permitir más intentos cuando haya token
              this.reconnectAttempts = 0
            }
          }
        } catch (error) {
          console.error('Error en reconexión:', error)
          // Si falla, programar otro intento
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.handleReconnect()
          }
        }
      }, delay)
    } else {
      console.error('Máximo número de intentos de reconexión alcanzado, reintentando en 30 segundos...')
      // Resetear intentos después de un tiempo para permitir reconexión futura
      setTimeout(() => {
        this.reconnectAttempts = 0
        console.log('Reiniciando intentos de reconexión')
      }, 30000)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.reconnectAttempts = 0
    }
  }

  getSocket(): Socket | null {
    return this.socket
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Escuchar el evento específico que viste en Postman
  onNewNotification(callback: (data: unknown) => void) {
    if (this.socket) {
      this.socket.on('new-notification', callback)
    }
  }

  // Método para remover listeners específicos
  off(event: string, callback?: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  // Método público para refrescar el token
  async refreshToken(): Promise<boolean> {
    return await this.refreshTokenAndReconnect()
  }

  // Método para verificar si el token está próximo a expirar
  private isTokenNearExpiry(): boolean {
    const token = localStorage.getItem('accessToken')
    if (!token) return true

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiry = payload.exp * 1000
      const now = Date.now()
      const timeLeft = expiry - now
      
      // Refrescar si quedan menos de 5 minutos
      return timeLeft < 5 * 60 * 1000
    } catch {
      return true
    }
  }

  // Método para verificar y refrescar token preventivamente
  private async checkAndRefreshToken(): Promise<boolean> {
    if (this.isTokenNearExpiry()) {
      console.log('Token próximo a expirar, refrescando preventivamente...')
      return await this.refreshTokenAndReconnect()
    }
    return true
  }

  // Método para emitir eventos al servidor
  emit(event: string, data?: unknown) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data)
    }
  }

  // Método para mantener la conexión activa
  keepAlive() {
    if (this.socket && this.socket.connected) {
      // Enviar un ping para mantener la conexión activa
      this.socket.emit('ping')
      console.log('Ping enviado para mantener conexión activa')
    } else {
      console.log('Socket no conectado, no se puede enviar ping')
    }
  }

  // Método para verificar y reconectar si es necesario
  async ensureConnection(): Promise<boolean> {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.log('No hay token disponible para conexión')
      return false
    }

    if (this.socket?.connected) {
      console.log('Socket ya está conectado')
      return true
    }

    try {
      console.log('Verificando conexión, reconectando si es necesario...')
      await this.connect(token)
      return true
    } catch (error) {
      console.error('Error al verificar/conectar socket:', error)
      return false
    }
  }

  // Método para verificar el estado de la conexión
  isConnectionHealthy(): boolean {
    if (!this.socket) {
      return false
    }
    
    // Verificar si el socket está conectado y no hay errores recientes
    return this.socket.connected && !this.socket.disconnected
  }

  // Método para forzar reconexión
  async forceReconnect(): Promise<boolean> {
    console.log('Forzando reconexión del socket...')
    
    // Desconectar primero si hay una conexión existente
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    
    // Resetear estado
    this.isConnecting = false
    this.connectionPromise = null
    this.reconnectAttempts = 0
    
    // Intentar conectar nuevamente
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.error('No hay token disponible para reconexión forzada')
      return false
    }
    
    try {
      await this.connect(token)
      return true
    } catch (error) {
      console.error('Error en reconexión forzada:', error)
      return false
    }
  }
}

export const socketService = new SocketService()

// Hook simple para conexión
export const useSocket = () => {
  const connectSocket = async (accessToken: string) => {
    try {
      await socketService.connect(accessToken)
      return true
    } catch (error) {
      console.error('Error al conectar Socket:', error)
      return false
    }
  }

  const disconnectSocket = () => {
    socketService.disconnect()
  }

  return {
    connectSocket,
    disconnectSocket,
    socket: socketService.getSocket(),
    isConnected: socketService.isConnected(),
    addListener: socketService.addListener.bind(socketService),
    removeListener: socketService.removeListener.bind(socketService),
    emit: socketService.emit.bind(socketService),
    off: socketService.off.bind(socketService),
    refreshToken: socketService.refreshToken.bind(socketService),
    keepAlive: socketService.keepAlive.bind(socketService),
    ensureConnection: socketService.ensureConnection.bind(socketService),
    isConnectionHealthy: socketService.isConnectionHealthy.bind(socketService),
    forceReconnect: socketService.forceReconnect.bind(socketService)
  }
}