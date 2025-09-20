export interface Role {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  name: string
  description: string
}

export interface User {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  email: string
  firstName: string
  lastName: string
  urlPerfil: string | null
  imagePath: string | null
  isActive: boolean
  isVerified: boolean
  lastLoginAt: string | null
  roles: Role[]
}

export interface UsersResponse {
  data: User[]
  total: number
  currentPage: string
  totalPages: number
  limit: string
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface CreateUserRequest {
  email: string
  password: string
  firstName?: string
  lastName?: string
  roleIds?: string[]
  profileImage?: File
}

export interface UpdateUserRequest {
  firstName?: string
  lastName?: string
  roleIds?: string[]
  profileImage?: File
  isActive?: boolean
}

export interface UsersQueryParams {
  page?: number
  limit?: number
  sortOrder?: 'ASC' | 'DESC'
  sortBy?: 'email' | 'firstName' | 'lastName' | 'createdAt' | 'isActive'
  search?: string
  roleIds?: string[]
  isActive?: boolean
  createdAtFrom?: string
  createdAtTo?: string
}
