import * as React from 'react'
import { Loader2, Search, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGetParadasDeDestino } from '../hooks/use-get-paradas-de-destino'

/** Cuánto esperar antes de preguntarle al servidor por lo que se está tecleando. */
const ESPERA_DE_TIPEO_MS = 300
const TODOS = '__todos__'

interface DestinationParadasTableProps {
  destinationId: string
  onQuitar?: (paradaId: string, nombre: string) => void
  quitando?: boolean
}

/**
 * Las paradas homologadas de un destino.
 *
 * Filtra y pagina en el servidor: el listado puede crecer con cada empresa que
 * se conecte, y traerlo entero para filtrarlo en memoria deja de funcionar
 * mucho antes de que se note.
 */
export function DestinationParadasTable({
  destinationId,
  onQuitar,
  quitando,
}: DestinationParadasTableProps) {
  const [texto, setTexto] = React.useState('')
  const [busqueda, setBusqueda] = React.useState('')
  const [estado, setEstado] = React.useState<string>(TODOS)
  const [empresa, setEmpresa] = React.useState<string>(TODOS)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)

  // El buscador no dispara una consulta por tecla.
  React.useEffect(() => {
    const id = setTimeout(() => setBusqueda(texto), ESPERA_DE_TIPEO_MS)
    return () => clearTimeout(id)
  }, [texto])

  // Cualquier filtro nuevo vuelve a la primera página: quedarse en la 4 de un
  // resultado que ahora tiene una sola muestra una tabla vacía sin explicación.
  React.useEffect(() => {
    setPage(1)
  }, [busqueda, estado, empresa, limit])

  const { data, isLoading, isFetching, error } = useGetParadasDeDestino(
    destinationId,
    {
      page,
      limit,
      search: busqueda || undefined,
      activo: estado === TODOS ? undefined : estado === 'activas',
      empresa: empresa === TODOS ? undefined : empresa,
    },
  )

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const empresas = data?.empresas ?? []
  const hayFiltros = !!busqueda || estado !== TODOS || empresa !== TODOS

  const limpiarFiltros = () => {
    setTexto('')
    setEstado(TODOS)
    setEmpresa(TODOS)
  }

  return (
    <div>
      <div className='flex flex-wrap items-center gap-2 px-4 pb-3 md:px-6'>
        <div className='relative w-full sm:w-[260px]'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder='Buscar por nombre…'
            className='pl-9'
            aria-label='Buscar parada por nombre'
          />
        </div>

        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className='w-[170px]' aria-label='Filtrar por estado'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Estado: todos</SelectItem>
            <SelectItem value='activas'>Solo activas</SelectItem>
            <SelectItem value='inactivas'>Solo inactivas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={empresa} onValueChange={setEmpresa}>
          <SelectTrigger className='w-[220px]' aria-label='Filtrar por empresa'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Empresa: todas</SelectItem>
            {empresas.map((nombre) => (
              <SelectItem key={nombre} value={nombre}>
                {nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hayFiltros && (
          <Button variant='ghost' size='sm' onClick={limpiarFiltros}>
            Limpiar
          </Button>
        )}

        {isFetching && !isLoading && (
          <Loader2 className='text-muted-foreground ml-auto h-4 w-4 animate-spin' />
        )}
      </div>

      <div className='overflow-x-auto border-t'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Parada</TableHead>
              <TableHead>Empresa que la reporta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className='text-right'>&nbsp;</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className='text-muted-foreground py-10 text-center'>
                  Cargando paradas…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={4} className='text-destructive py-10 text-center'>
                  No se pudieron cargar las paradas. {error.message}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className='text-muted-foreground py-10 text-center'>
                  {hayFiltros
                    ? 'Ninguna parada coincide con los filtros.'
                    : 'Este destino todavía no tiene paradas homologadas.'}
                </TableCell>
              </TableRow>
            )}

            {items.map((parada) => (
              <TableRow key={parada.id}>
                <TableCell className='font-medium'>{parada.nombre}</TableCell>
                <TableCell className='text-muted-foreground'>
                  {parada.empresaNombre}
                </TableCell>
                <TableCell>
                  <Badge variant={parada.activo ? 'default' : 'secondary'}>
                    {parada.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell className='text-right'>
                  {onQuitar && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      disabled={quitando}
                      onClick={() => onQuitar(parada.id, parada.nombre)}
                    >
                      <Trash2 className='mr-1.5 h-3.5 w-3.5' />
                      Quitar
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className='flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 md:px-6'>
        <p className='text-muted-foreground text-sm'>
          {total === 0
            ? 'Sin resultados'
            : `Mostrando ${items.length} de ${total} parada${total === 1 ? '' : 's'}`}
        </p>

        <div className='flex items-center gap-2'>
          <Select
            value={String(limit)}
            onValueChange={(valor) => setLimit(Number(valor))}
          >
            <SelectTrigger className='h-8 w-[140px]' aria-label='Paradas por página'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 25, 50].map((cantidad) => (
                <SelectItem key={cantidad} value={String(cantidad)}>
                  {cantidad} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((actual) => Math.max(1, actual - 1))}
          >
            Anterior
          </Button>
          <span className='text-muted-foreground text-sm tabular-nums'>
            Página {page} de {totalPages}
          </span>
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((actual) => actual + 1)}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
}
