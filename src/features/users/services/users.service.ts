import { 
  User, 
  UsersResponse, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UsersQueryParams 
} from '../models/user'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class UsersService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  }

  private getAuthHeadersForFormData(): HeadersInit {
    const token = localStorage.getItem('accessToken')
    return {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
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
      if (response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        localStorage.removeItem('refreshToken')
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  private async requestWithFormData<T>(
    endpoint: string,
    formData: FormData,
    method: 'POST' | 'PUT' = 'POST'
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: this.getAuthHeadersForFormData(),
      body: formData,
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        localStorage.removeItem('refreshToken')
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

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
    
    formData.append('email', userData.email)
    formData.append('password', userData.password)
    
    if (userData.firstName) {
      formData.append('firstName', userData.firstName)
    }
    
    if (userData.lastName) {
      formData.append('lastName', userData.lastName)
    }
    
    if (userData.roleIds && userData.roleIds.length > 0) {
      userData.roleIds.forEach(roleId => {
        formData.append('roleIds', roleId)
      })
    }
    
    if (userData.profileImage) {
      formData.append('profileImage', userData.profileImage)
    }

    return this.requestWithFormData<User>('/api/usuarios', formData, 'POST')
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const formData = new FormData()
    
    if (userData.firstName) {
      formData.append('firstName', userData.firstName)
    }
    
    if (userData.lastName) {
      formData.append('lastName', userData.lastName)
    }
    
    if (userData.roleIds && userData.roleIds.length > 0) {
      userData.roleIds.forEach(roleId => {
        formData.append('roleIds', roleId)
      })
    }
    
    if (userData.profileImage) {
      formData.append('profileImage', userData.profileImage)
    }
    
    if (userData.isActive !== undefined) {
      formData.append('isActive', String(userData.isActive))
    }

    return this.requestWithFormData<User>(`/api/usuarios/${id}`, formData, 'PUT')
  }

  async deleteUser(id: string): Promise<void> {
    await this.request<void>(`/api/usuarios/${id}`, {
      method: 'DELETE',
    })
  }

  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return this.updateUser(id, { isActive })
  }
}

export const usersService = new UsersService()
