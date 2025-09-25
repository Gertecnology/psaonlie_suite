/* eslint-disable no-console */
import { useState, useEffect, useCallback } from 'react'
import { usersService } from '../services/users.service'
import { Role } from '../models/user'
import { useAuth } from '@/context/auth-context'

export interface UseRolesReturn {
  roles: Role[]
  isLoading: boolean
  error: string | null
  refreshRoles: () => Promise<void>
  clearError: () => void
}

export function useRoles(): UseRolesReturn {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { isAuthenticated } = useAuth()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const refreshRoles = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('Usuario no autenticado, saltando carga de roles')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Cargando roles...')
      const rolesData = await usersService.getRoles()
      setRoles(rolesData)
      console.log('Roles cargados:', rolesData.length)
    } catch (error) {
      console.error('Error al cargar roles:', error)
      setError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  // Cargar roles cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && roles.length === 0) {
      refreshRoles()
    }
  }, [isAuthenticated, roles.length, refreshRoles])

  return {
    roles,
    isLoading,
    error,
    refreshRoles,
    clearError
  }
}
