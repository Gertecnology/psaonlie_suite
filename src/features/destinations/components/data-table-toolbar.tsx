import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '../components/data-table-view-options'
import { type Destination } from '../models/destination.model'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const ORDER_FIELDS = [
  { value: 'none', label: 'Sin orden' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'cantidadParadas', label: 'Cantidad de paradas' },
]

interface DataTableToolbarProps {
  table: Table<Destination>
  onFilterChange?: (filters: Record<string, string>) => void
}

export function DataTableToolbar({ table, onFilterChange }: DataTableToolbarProps) {
  // Estados locales para los filtros
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('all')
  const [orderBy, setOrderBy] = useState('none')
  const [orderDirection, setOrderDirection] = useState('none')

  // Aplicar filtros a la tabla y notificar al padre para fetch remoto
  const handleSearch = (override?: Partial<{search: string, isActive: string, orderBy: string, orderDirection: string}>) => {
    const filters: Record<string, string> = {}
    const s = override?.search ?? search
    const ia = override?.isActive ?? isActive
    const ob = override?.orderBy ?? orderBy
    const od = override?.orderDirection ?? orderDirection
    if (s) filters.search = s
    if (ia !== 'all') filters.isActive = ia
    if (ob !== 'none') filters.orderBy = ob
    if (od !== 'none') filters.orderDirection = od
    if (onFilterChange) onFilterChange(filters)
  }

  const handleReset = () => {
    setSearch('')
    setIsActive('all')
    setOrderBy('none')
    setOrderDirection('none')
    if (onFilterChange) onFilterChange({})
  }

  return (
    <form
      className='w-full flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-x-4 mb-4'
      onSubmit={e => e.preventDefault()}
    >
      <div className='flex flex-1 gap-x-4 flex-wrap items-end'>
        <div className='flex flex-col flex-1 min-w-[120px]'>
          <Label htmlFor='search'>Nombre</Label>
          <Input
            id='search'
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              if (e.target.value.length >= 3 || e.target.value.length === 0) {
                handleSearch({search: e.target.value})
              }
            }}
            placeholder='Buscar por nombre'
            className='h-9'
          />
        </div>
        <div className='flex flex-col min-w-[110px]'>
          <Label htmlFor='isActive'>Estado</Label>
          <Select value={isActive} onValueChange={value => {
            setIsActive(value)
            handleSearch({isActive: value})
          }}>
            <SelectTrigger id='isActive' className='h-9'>
              <SelectValue placeholder='Todos' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              <SelectItem value='true'>Activo</SelectItem>
              <SelectItem value='false'>Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col min-w-[140px]'>
          <Label htmlFor='orderBy'>Ordenar por</Label>
          <Select value={orderBy} onValueChange={value => {
            setOrderBy(value)
            handleSearch({orderBy: value})
          }}>
            <SelectTrigger id='orderBy' className='h-9'>
              <SelectValue placeholder='Sin orden' />
            </SelectTrigger>
            <SelectContent>
              {ORDER_FIELDS.map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex flex-col min-w-[110px]'>
          <Label htmlFor='orderDirection'>Dirección</Label>
          <Select value={orderDirection} onValueChange={value => {
            setOrderDirection(value)
            handleSearch({orderDirection: value})
          }}>
            <SelectTrigger id='orderDirection' className='h-9'>
              <SelectValue placeholder='--' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='none'>--</SelectItem>
              <SelectItem value='ASC'>ASC</SelectItem>
              <SelectItem value='DESC'>DESC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className='flex gap-2 items-end ml-auto'>
        <Button type='button' variant='outline' onClick={handleReset} className='h-9'>Limpiar</Button>
        <DataTableViewOptions table={table} />
      </div>
    </form>
  )
}
