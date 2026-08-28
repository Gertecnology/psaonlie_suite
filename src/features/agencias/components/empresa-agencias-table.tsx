import * as React from 'react'
import { Loader2, Pencil, Search } from 'lucide-react'
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
import { useHijasPaginadas } from '../hooks/use-hijas-paginadas'
import { type HijaDeEmpresa } from '../services/agencia.service'
import { EditarAgenciaDialog } from './editar-agencia-dialog'

/** Cuánto esperar antes de preguntarle al servidor por lo que se está tecleando. */
const ESPERA_DE_TIPEO_MS = 300
const TODAS = '__todas__'

interface EmpresaAgenciasTableProps {
  empresaId: string
  /** Para decir de quién se hereda la comisión, no sólo que se hereda. */
  nombreEmpresa: string
}

const formatearComision = (valor: number | null): string =>
  valor === null ? '—' : `${valor} %`

/**
 * Las agencias de una empresa.
 *
 * Filtra y pagina en el servidor: la sincronización puede traer decenas por
 * empresa, y traerlas todas para filtrarlas en memoria deja de funcionar mucho
 * antes de que se note.
 */
export function EmpresaAgenciasTable({
  empresaId,
  nombreEmpresa,
}: EmpresaAgenciasTableProps) {
  const [texto, setTexto] = React.useState('')
  const [busqueda, setBusqueda] = React.useState('')
  const [estado, setEstado] = React.useState<string>(TODAS)
  const [page, setPage] = React.useState(1)
  const [limit, setLimit] = React.useState(10)
  const [enEdicion, setEnEdicion] = React.useState<HijaDeEmpresa | null>(null)

  // El buscador no dispara una consulta por tecla.
  React.useEffect(() => {
    const id = setTimeout(() => setBusqueda(texto), ESPERA_DE_TIPEO_MS)
    return () => clearTimeout(id)
  }, [texto])

  // Cualquier filtro nuevo vuelve a la primera página: quedarse en la 4 de un
  // resultado que ahora tiene una sola muestra una tabla vacía sin explicación.
  React.useEffect(() => {
    setPage(1)
  }, [busqueda, estado, limit])

  const { data, isLoading, isFetching, error } = useHijasPaginadas(empresaId, {
    page,
    limit,
    search: busqueda || undefined,
    activo: estado === TODAS ? undefined : estado === 'venden',
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const activas = data?.activas ?? 0
  const hayFiltros = !!busqueda || estado !== TODAS

  return (
    <div>
      <div className='flex flex-wrap items-center gap-2 px-4 pb-3 md:px-6'>
        <div className='relative w-full sm:w-[260px]'>
          <Search className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            value={texto}
            onChange={(evento) => setTexto(evento.target.value)}
            placeholder='Buscar por nombre o código…'
            className='pl-9'
            aria-label='Buscar agencia'
          />
        </div>

        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className='w-[170px]' aria-label='Filtrar por estado'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Estado: todas</SelectItem>
            <SelectItem value='venden'>Solo las que venden</SelectItem>
            <SelectItem value='no-venden'>Solo las que no venden</SelectItem>
          </SelectContent>
        </Select>

        {hayFiltros && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => {
              setTexto('')
              setEstado(TODAS)
            }}
          >
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
              <TableHead>Agencia</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Comisión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className='text-right'>&nbsp;</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className='text-muted-foreground py-10 text-center'>
                  Cargando agencias…
                </TableCell>
              </TableRow>
            )}

            {!isLoading && error && (
              <TableRow>
                <TableCell colSpan={5} className='text-destructive py-10 text-center'>
                  No se pudieron cargar las agencias. {error.message}
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className='text-muted-foreground py-10 text-center'>
                  {hayFiltros
                    ? 'Ninguna agencia coincide con los filtros.'
                    : 'Esta empresa todavía no tiene agencias. Las trae la sincronización.'}
                </TableCell>
              </TableRow>
            )}

            {items.map((agencia) => (
              <TableRow key={agencia.id}>
                <TableCell className='font-medium'>
                  {/* Muchas llegan sin nombre de la sincronización: se dice, en
                      vez de dejar la celda en blanco. */}
                  {agencia.nombre ?? (
                    <span className='text-muted-foreground italic'>Sin nombre</span>
                  )}
                </TableCell>
                <TableCell className='text-muted-foreground font-mono text-xs'>
                  {agencia.codigo ?? '—'}
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {formatearComision(agencia.comisionEfectiva)}
                  {agencia.heredaComision && (
                    <>
                      {' '}
                      <span className='text-muted-foreground/70 text-xs'>
                        heredada
                      </span>
                    </>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={agencia.activo ? 'default' : 'secondary'}>
                    {agencia.activo ? 'Vende' : 'No vende'}
                  </Badge>
                </TableCell>
                <TableCell className='text-right'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => setEnEdicion(agencia)}
                  >
                    <Pencil className='mr-1.5 h-3.5 w-3.5' />
                    Editar
                  </Button>
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
            : `Mostrando ${items.length} de ${total} agencia${total === 1 ? '' : 's'} · ${activas} vende${activas === 1 ? '' : 'n'}`}
        </p>

        <div className='flex items-center gap-2'>
          <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
            <SelectTrigger className='h-8 w-[140px]' aria-label='Agencias por página'>
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

      <EditarAgenciaDialog
        agencia={enEdicion}
        nombreEmpresa={nombreEmpresa}
        onCerrar={() => setEnEdicion(null)}
      />
    </div>
  )
}
