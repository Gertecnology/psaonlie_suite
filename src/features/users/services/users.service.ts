/* eslint-disable no-console */
import { 
  User, 
  Role,
  UsersResponse, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UsersQueryParams 
} from '../models/user'
import { BaseApiService } from '@/services/base-api.service'

class UsersService extends BaseApiService {

  async getUsers(params: UsersQueryParams = {}): Promise<UsersResponse> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => searchParams.append(key, item))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/api/usuarios?${queryString}` : '/api/usuarios'
    
    return this.request<UsersResponse>(endpoint)
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/api/usuarios/${id}`)
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    const formData = new FormData()
    
    // Campos obligatorios
    formData.append('email', userData.email)
    formData.append('password', userData.password)
    
    // Campos opcionales
    if (userData.firstName) {
      formData.append('firstName', userData.firstName)
    }
    
    if (userData.lastName) {
      formData.append('lastName', userData.lastName)
    }
    
    // Roles - enviar solo si existen
    if (userData.roleIds && userData.roleIds.length > 0) {
      userData.roleIds.forEach(roleId => {
        formData.append('roleIds', roleId)
      })
    }
    
    // Imagen de perfil - enviar solo si existe
    if (userData.profileImage) {
      formData.append('profileImage', userData.profileImage)
    }

    const response = await this.requestWithFormData<{message: string, user: User}>('/api/usuarios', formData, 'POST')
    return response.user
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    // Según la API, solo se pueden actualizar estos campos específicos
    const updateData: Record<string, unknown> = {}
    
    if (userData.firstName) {
      updateData.firstName = userData.firstName
    }
    
    if (userData.lastName) {
      updateData.lastName = userData.lastName
    }
    
    if (userData.roleIds && userData.roleIds.length > 0) {
      updateData.roleIds = userData.roleIds
    }
    
    if (userData.isActive !== undefined) {
      updateData.isActive = userData.isActive
    }

    if (userData.isVerified !== undefined) {
      updateData.isVerified = userData.isVerified
    }

    return this.request<User>(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    })
  }

  async resetUserPassword(id: string, newPassword: string): Promise<{message: string}> {
    return this.request<{message: string}>(`/api/usuarios/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    })
  }

  async deleteUser(id: string): Promise<void> {
    await this.request<void>(`/api/usuarios/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return this.updateUser(id, { isActive })
  }

  /**
   * Obtener todos los roles disponibles
   */
  async getRoles(): Promise<Role[]> {
    try {
      const roles = await this.request<Role[]>('/api/roles')
      return roles
    } catch (error) {
      console.error('Error al obtener roles:', error)
      throw error
    }
  }
}

export const usersService = new UsersService()
