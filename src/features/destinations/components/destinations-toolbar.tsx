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
import { type Destination } from '../models/destination.model'

/** Select value meaning "no filter". */
const TODOS = 'all'

const ESTADOS = [
  { etiqueta: 'Activo', valor: 'true' },
  { etiqueta: 'Inactivo', valor: 'false' },
]

const CAMPOS_ORDEN = [
  { etiqueta: 'Nombre', valor: 'nombre' },
  { etiqueta: 'Fecha de creación', valor: 'created_at' },
  { etiqueta: 'Última modificación', valor: 'updated_at' },
]

interface DestinationsToolbarProps {
  table: Table<Destination>
  busqueda: string
  onBusquedaChange: (valor: string) => void
  activo?: string
  onActivoChange: (valor: string | undefined) => void
  orden?: string
  direccion?: 'asc' | 'desc'
  onOrdenChange: (campo: string | undefined, direccion?: 'asc' | 'desc') => void
  hayFiltros: boolean
  onLimpiar: () => void
}

/**
 * Filters for the destination list.
 *
 * The previous version wrote every filter twice: once onto TanStack's column
 * filters and once, debounced, to the API. For those 300 ms the table filtered
 * the ten rows it already had, hiding some of them; and the debounce read its
 * own state through a stale closure, so the first change of sort order never
 * reached the server at all.
 *
 * Now there is one path: the control updates the URL, the URL drives the query.
 */
export function DestinationsToolbar({
  table,
  busqueda,
  onBusquedaChange,
  activo,
  onActivoChange,
  orden,
  direccion,
  onOrdenChange,
  hayFiltros,
  onLimpiar,
}: DestinationsToolbarProps) {
  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Buscar por nombre...'
          aria-label='Buscar destinos por nombre'
          value={busqueda}
          onChange={(evento) => onBusquedaChange(evento.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />

        <div className='flex gap-x-2'>
          <Select
            value={activo ?? TODOS}
            onValueChange={(valor) =>
              onActivoChange(valor === TODOS ? undefined : valor)
            }
          >
            <SelectTrigger className='h-8 w-[140px]' aria-label='Filtrar por estado'>
              <SelectValue placeholder='Estado' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los estados</SelectItem>
              {ESTADOS.map((estado) => (
                <SelectItem key={estado.valor} value={estado.valor}>
                  {estado.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={orden ?? TODOS}
            onValueChange={(valor) =>
              onOrdenChange(
                valor === TODOS ? undefined : valor,
                direccion ?? 'asc',
              )
            }
          >
            <SelectTrigger className='h-8 w-[170px]' aria-label='Ordenar por'>
              <SelectValue placeholder='Ordenar por' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Sin orden</SelectItem>
              {CAMPOS_ORDEN.map((campo) => (
                <SelectItem key={campo.valor} value={campo.valor}>
                  {campo.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* La dirección sólo tiene sentido si hay un campo por el que ordenar. */}
          {orden && (
            <Select
              value={direccion ?? 'asc'}
              onValueChange={(valor) =>
                onOrdenChange(orden, valor as 'asc' | 'desc')
              }
            >
              <SelectTrigger
                className='h-8 w-[130px]'
                aria-label='Dirección del orden'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='asc'>Ascendente</SelectItem>
                <SelectItem value='desc'>Descendente</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Aparece con CUALQUIER filtro. Antes sólo con el orden, así que una
            búsqueda escrita no se podía deshacer más que borrándola a mano. */}
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
