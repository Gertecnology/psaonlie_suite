/* eslint-disable no-console */
import { AuthErrorHandler } from '@/utils/auth-error-handler'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Base API service class that provides common functionality for all API services
 * Includes authentication error handling and token refresh logic
 */
export abstract class BaseApiService {
  protected async attemptTokenRefresh(): Promise<boolean> {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken')
      if (!storedRefreshToken) {
        return false
      }

      // Import refreshToken function dynamically to avoid circular dependencies
      const { refreshToken } = await import('@/services/auth')
      const data = await refreshToken(storedRefreshToken)
      
      // Update tokens in localStorage
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      return true
    } catch (error) {
      console.error('Error al renovar token:', error)
      return false
    }
  }

  protected getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  }

  protected getAuthHeadersForFormData(): HeadersInit {
    const token = localStorage.getItem('accessToken')
    return {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  }

  protected async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      if (response.status === 401 && retryCount === 0) {
        // Try to refresh token once
        const refreshSuccess = await this.attemptTokenRefresh()
        if (refreshSuccess) {
          // Retry the request with the new token
          return this.request<T>(endpoint, options, retryCount + 1)
        } else {
          // If refresh fails, use authentication error handler
          const authError = new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
          AuthErrorHandler.handleAuthError(authError)
          throw authError
        }
      }
      
      if (response.status === 401) {
        const authError = new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        AuthErrorHandler.handleAuthError(authError)
        throw authError
      }
      
      // Try to get error message from server
      let errorMessage = `Error ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        // If can't parse JSON, use default message
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }

  protected async requestWithFormData<T>(
    endpoint: string,
    formData: FormData,
    method: 'POST' | 'PUT' = 'POST',
    retryCount: number = 0
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: this.getAuthHeadersForFormData(),
      body: formData,
    })

    if (!response.ok) {
      if (response.status === 401 && retryCount === 0) {
        // Try to refresh token once
        const refreshSuccess = await this.attemptTokenRefresh()
        if (refreshSuccess) {
          // Retry the request with the new token
          return this.requestWithFormData<T>(endpoint, formData, method, retryCount + 1)
        } else {
          // If refresh fails, use authentication error handler
          const authError = new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
          AuthErrorHandler.handleAuthError(authError)
          throw authError
        }
      }
      
      if (response.status === 401) {
        const authError = new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
        AuthErrorHandler.handleAuthError(authError)
        throw authError
      }
      
      // Try to get error message from server
      let errorMessage = `Error ${response.status}: ${response.statusText}`
      try {
        const errorData = await response.json()
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        // If can't parse JSON, use default message
      }
      
      throw new Error(errorMessage)
    }

    return response.json()
  }
}
