import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const ORDER_FIELDS = [
  { value: '', label: 'Sin orden' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'cantidadParadas', label: 'Cantidad de paradas' },
]

export interface DestinationsFiltersValues {
  search: string
  isActive: string
  startDate: string
  endDate: string
  orderBy: string
  orderDirection: string
}

export function DestinationsFilters({ onFilter }: { onFilter: (values: DestinationsFiltersValues) => void }) {
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [orderBy, setOrderBy] = useState('')
  const [orderDirection, setOrderDirection] = useState('')

  const handleSearch = () => {
    onFilter({ search, isActive, startDate, endDate, orderBy, orderDirection })
  }

  const handleReset = () => {
    setSearch('')
    setIsActive('')
    setStartDate('')
    setEndDate('')
    setOrderBy('')
    setOrderDirection('')
    onFilter({ search: '', isActive: '', startDate: '', endDate: '', orderBy: '', orderDirection: '' })
  }

  return (
    <form
      className='flex flex-wrap gap-4 items-end bg-muted/40 p-4 rounded-md mb-4'
      onSubmit={e => { e.preventDefault(); handleSearch() }}
    >
      <div>
        <Label htmlFor='search'>Nombre</Label>
        <Input id='search' value={search} onChange={e => setSearch(e.target.value)} placeholder='Buscar por nombre' />
      </div>
      <div>
        <Label htmlFor='isActive'>Estado</Label>
        <Select value={isActive} onValueChange={setIsActive}>
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
        <Label htmlFor='startDate'>Fecha inicial</Label>
        <Input id='startDate' type='date' value={startDate} onChange={e => setStartDate(e.target.value)} />
      </div>
      <div>
        <Label htmlFor='endDate'>Fecha final</Label>
        <Input id='endDate' type='date' value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>
      <div>
        <Label htmlFor='orderBy'>Ordenar por</Label>
        <Select value={orderBy} onValueChange={setOrderBy}>
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
        <Select value={orderDirection} onValueChange={setOrderDirection}>
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
        <Button type='submit' variant='default'>Buscar</Button>
        <Button type='button' variant='outline' onClick={handleReset}>Limpiar</Button>
      </div>
    </form>
  )
} 