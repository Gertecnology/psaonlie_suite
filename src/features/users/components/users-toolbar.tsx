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
import { DataTableViewOptions } from '@/components/data-table'
import { type User } from '../models/user'

/** Select value meaning "no filter". */
const TODOS = 'all'

interface UsersToolbarProps {
  table: Table<User>
  busqueda: string
  onBusquedaChange: (valor: string) => void
  activo?: string
  onActivoChange: (valor: string | undefined) => void
  hayFiltros: boolean
  onLimpiar: () => void
}

/**
 * Filters for the user list.
 *
 * They used to be written onto TanStack's column filters while paging happened
 * on the server — so searching only ever matched among the ten rows on screen,
 * and a user on page four was unfindable. Now they travel to the API, which is
 * the only place that can see every user.
 */
export function UsersToolbar({
  table,
  busqueda,
  onBusquedaChange,
  activo,
  onActivoChange,
  hayFiltros,
  onLimpiar,
}: UsersToolbarProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Buscar por nombre o correo...'
          aria-label='Buscar usuarios'
          value={busqueda}
          onChange={(evento) => onBusquedaChange(evento.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        <Select
          value={activo ?? TODOS}
          onValueChange={(valor) =>
            onActivoChange(valor === TODOS ? undefined : valor)
          }
        >
          <SelectTrigger className='h-8 w-[150px]' aria-label='Filtrar por estado'>
            <SelectValue placeholder='Estado' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos los estados</SelectItem>
            <SelectItem value='true'>Activo</SelectItem>
            <SelectItem value='false'>Inactivo</SelectItem>
          </SelectContent>
        </Select>
        {hayFiltros && (
          <Button variant='ghost' onClick={onLimpiar} className='h-8 px-2 lg:px-3'>
            Limpiar
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
