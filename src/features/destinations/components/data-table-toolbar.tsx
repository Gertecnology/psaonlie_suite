import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '../components/data-table-view-options'
import { type Destination } from '../models/destination.model'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { useState, useRef } from 'react'

const statuses = [
  { label: 'Activo', value: 'true' },
  { label: 'Inactivo', value: 'false' },
]

const orderFields = [
  { label: 'Sin orden', value: 'none' },
  { label: 'Nombre', value: 'nombre' },
  { label: 'Fecha de creación', value: 'created_at' },
  { label: 'Fecha de actualización', value: 'updated_at' },
]

const orderDirections = [
  { label: '--', value: 'none' },
  { label: 'ASC', value: 'ASC' },
  { label: 'DESC', value: 'DESC' },
]

interface DataTableToolbarProps {
  table: Table<Destination>
  onFilterChange?: (filters: Record<string, string>) => void
}

export function DataTableToolbar({ table, onFilterChange }: DataTableToolbarProps) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  // Estados locales para los filtros externos
  const [orderBy, setOrderBy] = useState<string>('none')
  const [orderDirection, setOrderDirection] = useState<string>('none')

  // Función para construir los filtros según la API
  const buildFilters = () => {
    const filters: Record<string, string> = {}
    
    // Filtro de búsqueda
    const searchValue = table.getColumn('nombre')?.getFilterValue() as string
    if (searchValue) {
      filters.search = searchValue
    }

    // Filtro de estado
    const activeValue = table.getColumn('activo')?.getFilterValue() as string[]
    if (activeValue && activeValue.length > 0) {
      filters.isActive = activeValue[0]
    }

    // Filtro de ordenamiento
    if (orderBy !== 'none') {
      filters.orderBy = orderBy
    }

    // Filtro de dirección de ordenamiento (sortOrder para la API)
    if (orderDirection !== 'none') {
      filters.sortOrder = orderDirection
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

  // Función para manejar cambios en ordenamiento
  const handleOrderByChange = (value: string) => {
    setOrderBy(value)
    handleFilterChange()
  }

  // Función para manejar cambios en dirección
  const handleOrderDirectionChange = (value: string) => {
    setOrderDirection(value)
    handleFilterChange()
  }

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    table.resetColumnFilters()
    setOrderBy('none')
    setOrderDirection('none')
    if (onFilterChange) {
      onFilterChange({})
    }
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Buscar por nombre...'
          value={
            (table.getColumn('nombre')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) => {
            const value = event.target.value
            table.getColumn('nombre')?.setFilterValue(value)
            handleFilterChange()
          }}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        <div className='flex gap-x-2'>
          {table.getColumn('activo') && (
            <DataTableFacetedFilter
              column={table.getColumn('activo')}
              title='Estado'
              options={statuses}
            />
          )}
          <DataTableFacetedFilter
            title='Ordenar por'
            options={orderFields}
            isExternal={true}
            externalFilter={{
              value: orderBy,
              onChange: handleOrderByChange
            }}
          />
          <DataTableFacetedFilter
            title='Dirección'
            options={orderDirections}
            isExternal={true}
            externalFilter={{
              value: orderDirection,
              onChange: handleOrderDirectionChange
            }}
          />
        </div>
        {(orderBy !== 'none' || orderDirection !== 'none') && (
          <Button
            variant='ghost'
            onClick={handleClearFilters}
            className='h-8 px-2 lg:px-3'
          >
            Limpiar
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
