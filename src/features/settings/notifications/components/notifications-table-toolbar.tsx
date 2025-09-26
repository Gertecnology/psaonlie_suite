import { useState, useRef } from 'react'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  CheckCircle, 
  Filter, 
  MoreHorizontal, 
  Search, 
  X 
} from 'lucide-react'
import { type NotificationResponse } from '@/services/notifications'

interface NotificationsTableToolbarProps {
  table: Table<NotificationResponse>
  onFilterChange?: (filters: Record<string, string>) => void
  onMarkAllAsRead?: () => void
  unreadCount?: number
}

export function NotificationsTableToolbar({ 
  table, 
  onFilterChange, 
  onMarkAllAsRead,
  unreadCount = 0 
}: NotificationsTableToolbarProps) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  // Estados locales para los filtros externos
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false)

  // Función para construir los filtros según la API
  const buildFilters = () => {
    const filters: Record<string, string> = {}
    
    // Filtro de búsqueda
    const searchValue = table.getColumn('title')?.getFilterValue() as string
    if (searchValue) {
      filters.search = searchValue
    }

    // Filtro de tipo
    if (typeFilter !== 'all') {
      filters.type = typeFilter
    }

    // Filtro de prioridad
    if (priorityFilter !== 'all') {
      filters.priority = priorityFilter
    }

    // Filtro de no leídas
    if (unreadOnly) {
      filters.unreadOnly = 'true'
    }

    return filters
  }

  // Función para manejar cambios en los filtros con debounce
  const handleFilterChange = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      const filters = buildFilters()
      if (onFilterChange) {
        onFilterChange(filters)
      }
    }, 300)
  }

  // Función para limpiar todos los filtros
  const clearFilters = () => {
    table.getColumn('title')?.setFilterValue('')
    setTypeFilter('all')
    setPriorityFilter('all')
    setUnreadOnly(false)
    
    if (onFilterChange) {
      onFilterChange({})
    }
  }

  // Verificar si hay filtros activos
  const hasActiveFilters = 
    table.getColumn('title')?.getFilterValue() ||
    typeFilter !== 'all' ||
    priorityFilter !== 'all' ||
    unreadOnly

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notificaciones..."
            value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
            onChange={(event) => {
              table.getColumn('title')?.setFilterValue(event.target.value)
              handleFilterChange()
            }}
            className="pl-8 w-[250px]"
          />
        </div>

        {/* Filtro de tipo */}
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value)
            handleFilterChange()
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="VENTA_NUEVA">Venta Nueva</SelectItem>
            <SelectItem value="VENTA_PENDIENTE">Venta Pendiente</SelectItem>
            <SelectItem value="PAGO_CONFIRMADO">Pago Confirmado</SelectItem>
            <SelectItem value="PAGO_RECHAZADO">Pago Rechazado</SelectItem>
            <SelectItem value="SISTEMA">Sistema</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de prioridad */}
        <Select
          value={priorityFilter}
          onValueChange={(value) => {
            setPriorityFilter(value)
            handleFilterChange()
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="URGENT">Urgente</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="MEDIUM">Media</SelectItem>
            <SelectItem value="LOW">Baja</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de no leídas */}
        <Button
          variant={unreadOnly ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setUnreadOnly(!unreadOnly)
            handleFilterChange()
          }}
        >
          <Filter className="mr-2 h-4 w-4" />
          Solo no leídas ({unreadCount})
        </Button>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="h-8 px-2 lg:px-3"
          >
            Limpiar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center space-x-2">
        {unreadCount > 0 && onMarkAllAsRead && (
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllAsRead}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => table.toggleAllPageRowsSelected(!table.getIsAllPageRowsSelected())}>
              {table.getIsAllPageRowsSelected() ? 'Deseleccionar todo' : 'Seleccionar todo'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
