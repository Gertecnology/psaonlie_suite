import { Cross2Icon } from '@radix-ui/react-icons'
import { type Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '@/components/data-table'
import { type ClienteConEstadisticas } from '../models/clients.model'

interface ClientsToolbarProps {
  table: Table<ClienteConEstadisticas>
  busqueda: string
  onBusquedaChange: (valor: string) => void
  hayFiltros: boolean
  onLimpiar: () => void
}

/**
 * Search for the client list.
 *
 * The box is controlled by the page and the term travels to the API as
 * `termino`. The debounce that used to sit in the page —a `useEffect` with its
 * own `setTimeout`— is gone: `useTablaServidor` already waits before writing
 * the term to the URL, and doing it twice meant two sources of truth for what
 * had actually been searched.
 */
export function ClientsToolbar({
  table,
  busqueda,
  onBusquedaChange,
  hayFiltros,
  onLimpiar,
}: ClientsToolbarProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Buscar por nombre, apellido, email...'
          aria-label='Buscar clientes'
          value={busqueda}
          onChange={(evento) => onBusquedaChange(evento.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />
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
