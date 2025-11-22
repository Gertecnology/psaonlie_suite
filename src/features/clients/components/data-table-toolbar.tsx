import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClienteConEstadisticas } from '../models/clients.model'

interface DataTableToolbarProps {
  table: Table<ClienteConEstadisticas>
  searchTerm: string
  onSearchTermChange: (value: string) => void
}

export function DataTableToolbar({ 
  searchTerm, 
  onSearchTermChange,
}: DataTableToolbarProps) {
  const hasFilters = searchTerm !== ''

  const handleClearFilters = () => {
    onSearchTermChange('')
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder='Buscar por nombre, apellido, email...'
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        {hasFilters && (
          <Button
            variant='ghost'
            onClick={handleClearFilters}
            className='h-8 px-2 lg:px-3'
          >
            Limpiar filtros
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  )
}
