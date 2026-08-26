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
import { type FilaAgencia } from '../models/agencia.model'

/** Select value meaning "no status filter". */
const TODOS = 'all'

interface AgenciasToolbarProps {
  table: Table<FilaAgencia>
  busqueda: string
  onBusquedaChange: (valor: string) => void
  activo?: boolean
  onActivoChange: (valor: boolean | undefined) => void
  hayFiltros: boolean
  onLimpiar: () => void
}

/**
 * Search and status filter for the agency list.
 *
 * Both are driven by the page and travel to the backend. They used to be
 * written onto TanStack's column filters, which only ever see the rows of the
 * current page — so searching found matches in the ten rows on screen and
 * nowhere else.
 */
export function AgenciasToolbar({
  table,
  busqueda,
  onBusquedaChange,
  activo,
  onActivoChange,
  hayFiltros,
  onLimpiar,
}: AgenciasToolbarProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Buscar por nombre...'
          aria-label='Buscar agencias por nombre'
          value={busqueda}
          onChange={(evento) => onBusquedaChange(evento.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        <Select
          value={activo === undefined ? TODOS : String(activo)}
          onValueChange={(valor) =>
            onActivoChange(valor === TODOS ? undefined : valor === 'true')
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
          <Button
            variant='ghost'
            onClick={onLimpiar}
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
