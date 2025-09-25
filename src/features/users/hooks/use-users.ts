import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '../services/users.service'
import { 
  User, 
  Role,
  UsersResponse, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UsersQueryParams 
} from '../models/user'

// Hook para obtener la lista de roles
export const useRoles = () => {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => usersService.getRoles(),
    staleTime: 10 * 60 * 1000, // 10 minutos (los roles cambian menos frecuentemente)
  })
}

// Hook para obtener la lista de usuarios
export const useUsers = (params: UsersQueryParams = {}) => {
  return useQuery<UsersResponse>({
    queryKey: ['users', params],
    queryFn: () => usersService.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener un usuario específico
export const useUser = (id: string) => {
  return useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => usersService.getUserById(id),
    enabled: !!id,
  })
}

// Hook para crear un usuario
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userData: CreateUserRequest) => usersService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Hook para actualizar un usuario
export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: UpdateUserRequest }) => 
      usersService.updateUser(id, userData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
    },
  })
}

// Hook para eliminar un usuario
export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

// Hook para cambiar el estado de un usuario
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      usersService.toggleUserStatus(id, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
    },
  })
}

// Hook para manejar filtros y paginación
export const useUsersFilters = () => {
  const [filters, setFilters] = useState<UsersQueryParams>({
    page: 1,
    limit: 10,
    sortOrder: 'DESC',
    sortBy: 'createdAt',
  })

  const updateFilter = <K extends keyof UsersQueryParams>(
    key: K, 
    value: UsersQueryParams[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Reset page when changing filters (except page itself)
      ...(key !== 'page' && { page: 1 }),
    }))
  }

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortOrder: 'DESC',
      sortBy: 'createdAt',
    })
  }

  return {
    filters,
    updateFilter,
    resetFilters,
  }
}
