import {
  IconCash,
  IconShield,
  IconUsersGroup,
  IconUserShield,
} from '@tabler/icons-react'

// Mapeo de estados de usuario para colores de badges
export const userStatusColors = new Map<boolean, string>([
  [true, 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  [false, 'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10'],
])

// Mapeo de estados de verificación para colores de badges
export const verificationStatusColors = new Map<boolean, string>([
  [true, 'bg-green-100/30 text-green-900 dark:text-green-200 border-green-200'],
  [false, 'bg-yellow-100/30 text-yellow-900 dark:text-yellow-200 border-yellow-200'],
])

// Tipos de roles disponibles
export const userRoles = [
  {
    label: 'Administrador',
    value: 'admin',
    icon: IconShield,
    description: 'Administrador del sistema con acceso completo',
  },
  {
    label: 'Super Administrador',
    value: 'superadmin',
    icon: IconUserShield,
    description: 'Super administrador con todos los permisos',
  },
  {
    label: 'Gerente',
    value: 'manager',
    icon: IconUsersGroup,
    description: 'Gerente con permisos de gestión',
  },
  {
    label: 'Vendedor',
    value: 'cashier',
    icon: IconCash,
    description: 'Vendedor con permisos de venta y consulta',
  },
] as const

// Opciones de ordenamiento
export const sortOptions = [
  { label: 'Email', value: 'email' },
  { label: 'Nombre', value: 'firstName' },
  { label: 'Apellido', value: 'lastName' },
  { label: 'Fecha de Creación', value: 'createdAt' },
  { label: 'Estado Activo', value: 'isActive' },
] as const

// Opciones de límite de resultados por página
export const limitOptions = [
  { label: '10 por página', value: 10 },
  { label: '25 por página', value: 25 },
  { label: '50 por página', value: 50 },
  { label: '100 por página', value: 100 },
] as const
