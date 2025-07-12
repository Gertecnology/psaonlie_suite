import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const ORDER_FIELDS = [
  { value: '', label: 'Sin orden' },
  { value: 'nombre', label: 'Nombre' },
]

export interface DestinationsFiltersValues {
  search: string
  isActive: string
  orderBy: string
  orderDirection: string
}

export function DestinationsFilters({ onFilter }: { onFilter: (values: DestinationsFiltersValues) => void }) {
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('')
  const [orderBy, setOrderBy] = useState('')
  const [orderDirection, setOrderDirection] = useState('')

  const handleReset = () => {
    setSearch('')
    setIsActive('')
    setOrderBy('')
    setOrderDirection('')
    onFilter({ search: '', isActive: '', orderBy: '', orderDirection: '' })
  }

  return (
    <form className='flex flex-wrap gap-4 items-end bg-muted/40 p-4 rounded-md mb-4' onSubmit={e => e.preventDefault()}>
      <div>
        <Label htmlFor='search'>Nombre</Label>
        <Input
          id='search'
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            if (e.target.value.length >= 3 || e.target.value.length === 0) {
              onFilter({ search: e.target.value, isActive, orderBy, orderDirection })
            }
          }}
          placeholder='Buscar por nombre'
        />
      </div>
      <div>
        <Label htmlFor='isActive'>Estado</Label>
        <Select value={isActive} onValueChange={value => {
          setIsActive(value)
          onFilter({ search, isActive: value, orderBy, orderDirection })
        }}>
          <SelectTrigger id='isActive' className='w-32'>
            <SelectValue placeholder='Todos' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos</SelectItem>
            <SelectItem value='true'>Activo</SelectItem>
            <SelectItem value='false'>Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor='orderBy'>Ordenar por</Label>
        <Select value={orderBy} onValueChange={value => {
          setOrderBy(value)
          onFilter({ search, isActive, orderBy: value, orderDirection })
        }}>
          <SelectTrigger id='orderBy' className='w-40'>
            <SelectValue placeholder='Sin orden' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>Sin orden</SelectItem>
            {ORDER_FIELDS.filter(f => f.value).map(f => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor='orderDirection'>Dirección</Label>
        <Select value={orderDirection} onValueChange={value => {
          setOrderDirection(value)
          onFilter({ search, isActive, orderBy, orderDirection: value })
        }}>
          <SelectTrigger id='orderDirection' className='w-28'>
            <SelectValue placeholder='--' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='none'>--</SelectItem>
            <SelectItem value='ASC'>ASC</SelectItem>
            <SelectItem value='DESC'>DESC</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='flex gap-2'>
        <Button type='button' variant='outline' onClick={handleReset}>Limpiar</Button>
      </div>
    </form>
  )
} 