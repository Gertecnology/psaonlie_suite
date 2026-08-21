import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTableViewOptions } from '../components/data-table-view-options'
import { type Company } from '../models/company.model'

/** Valor del select cuando no hay filtro de estado aplicado. */
const ALL_STATUSES = 'all'

interface DataTableToolbarProps {
  table: Table<Company>
  search: string
  onSearchChange: (value: string) => void
  activo?: boolean
  onActivoChange: (value: boolean | undefined) => void
}

/**
 * Barra de filtros del listado.
 *
 * La búsqueda y el estado son controlados desde la página y viajan al backend:
 * antes se escribían sobre los filtros de columna de TanStack Table, que sólo
 * ven las filas de la página actual.
 */
export function DataTableToolbar({
  table,
  search,
  onSearchChange,
  activo,
  onActivoChange,
}: DataTableToolbarProps) {
  const isFiltered = search !== '' || activo !== undefined

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Buscar por nombre...'
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        <div className='flex gap-x-2'>
          <Select
            value={activo === undefined ? ALL_STATUSES : String(activo)}
            onValueChange={(value) =>
              onActivoChange(value === ALL_STATUSES ? undefined : value === 'true')
            }
          >
            <SelectTrigger className='h-8 w-[150px]'>
              <SelectValue placeholder='Estado' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>Todos los estados</SelectItem>
              <SelectItem value='true'>Activo</SelectItem>
              <SelectItem value='false'>Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              onSearchChange('')
              onActivoChange(undefined)
            }}
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
