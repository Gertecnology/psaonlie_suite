import * as React from 'react'
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as TablaTanStack,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from './data-table-pagination'
import './types'

/**
 * The one data table.
 *
 * Every list screen used to ship its own copy — seven of them, and they had
 * drifted apart. Five indexed row selection by position instead of by row, so a
 * background refetch could point a checked box at a different record; two ran
 * the client filter on top of an already server-filtered page; one had no way
 * to clear its search. Those were not style differences, they were defects, and
 * each copy had a different subset of them.
 *
 * The engine here is the one from the agencias table, which was the only
 * correct one, plus the extension points the others had invented: a replaceable
 * toolbar, per-column classes, and its own loading and error states.
 *
 * ## Server-side by contract
 *
 * Paging, searching, filtering and sorting all happen on the server. The table
 * never re-filters what it receives — the page it is handed IS the answer. That
 * is why `manualPagination` and `manualFiltering` are both fixed to `true` and
 * `getFilteredRowModel` is absent: with them, TanStack would filter the ten rows
 * on screen a second time and quietly hide some of them.
 */
export interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]

  /**
   * Stable identity for a row.
   *
   * Required, not optional. Without it TanStack keys selection by position, so
   * after a refetch the key `"0"` means "whatever is first now" — and a bulk
   * delete acts on the key, not on the record. That is how you delete the wrong
   * row, and it is the reason this parameter has no default.
   */
  getRowId: (fila: TData) => string

  /** Total pages according to the server, not to the array received. */
  pageCount: number
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>

  /** Toolbar for this table. It gets the instance to drive column visibility. */
  renderToolbar?: (tabla: TablaTanStack<TData>) => React.ReactNode

  /** Rendered between the toolbar and the table, e.g. a bulk-action bar. */
  renderBulkActions?: (
    seleccionadas: TData[],
    limpiarSeleccion: () => void,
  ) => React.ReactNode

  /**
   * Totals row. Must return `<tr>`s: they are rendered inside a `<tfoot>`.
   *
   * It has to live inside the table and not in a block underneath it, because
   * the report print sheet gives `tfoot` `display: table-footer-group` — which
   * is what repeats the totals at the bottom of *every* printed page. A block
   * after the table prints once, at the end of the last sheet, where nobody
   * comparing figures on page two can see it.
   *
   * Only rendered when there are rows: a totals line under an empty table
   * states a total for nothing.
   */
  renderFooter?: () => React.ReactNode

  /** Which rows may be selected. Omitted means all of them. */
  enableRowSelection?: boolean | ((fila: Row<TData>) => boolean)

  /** Extra attributes per row, e.g. to shade a hierarchy level. */
  rowProps?: (fila: TData) => React.HTMLAttributes<HTMLTableRowElement>

  /** First load: nothing to show yet. */
  isLoading?: boolean
  /** Background refetch: the table dims instead of unmounting. */
  isFetching?: boolean
  error?: Error | null
  onRetry?: () => void

  /**
   * Anything that should discard the current selection when it changes —
   * typically the search term and the active filters.
   *
   * The rows the user ticked are no longer on screen after a filter change, and
   * acting on them blind is how a bulk delete hits the wrong records.
   */
  resetSelectionOn?: unknown[]

  /** Describes the table for screen readers. Rendered as a `<caption>`. */
  caption: string

  emptyMessage?: string

  /**
   * Columns hidden until the user asks for them, by id.
   *
   * A list is read to answer a question, and nine columns of everything answer
   * none of them: the eye has to sweep the whole row to find the two figures
   * that matter. Connection details — the web service URL, its user, the
   * agency code — are needed when you edit a company, not when you scan the
   * list looking for one. They stay one click away in the column menu.
   */
  columnasOcultasPorDefecto?: string[]
}

export function DataTable<TData>({
  columns,
  data,
  getRowId,
  pageCount,
  pagination,
  onPaginationChange,
  renderToolbar,
  renderBulkActions,
  renderFooter,
  enableRowSelection,
  rowProps,
  isLoading = false,
  isFetching = false,
  error = null,
  onRetry,
  resetSelectionOn = [],
  caption,
  emptyMessage = 'No hay resultados.',
  columnasOcultasPorDefecto,
}: DataTableProps<TData>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    () =>
      Object.fromEntries(
        (columnasOcultasPorDefecto ?? []).map((id) => [id, false]),
      ),
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  /**
   * Actions go last.
   *
   * They used to be pinned right after the checkbox, on the theory that it is
   * where the eye looks. It is not: a row is read left to right and the first
   * thing it has to say is *what* it is — the name — not what you can do to it.
   * Opening a list whose first column is a menu button means every row starts
   * with a question instead of an answer.
   */
  const columnasOrdenadas = React.useMemo(() => {
    if (!columns?.length) return columns

    const indiceAcciones = columns.findIndex((columna) => columna.id === 'actions')
    if (indiceAcciones === -1 || indiceAcciones === columns.length - 1) {
      return columns
    }

    const reordenadas = [...columns]
    const [acciones] = reordenadas.splice(indiceAcciones, 1)
    reordenadas.push(acciones)
    return reordenadas
  }, [columns])

  const limpiarSeleccion = React.useCallback(() => {
    setRowSelection((previa) => (Object.keys(previa).length ? {} : previa))
  }, [])

  React.useEffect(() => {
    limpiarSeleccion()
    // Las dependencias son dinámicas a propósito: cada tabla decide qué cambio
    // invalida su selección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    limpiarSeleccion,
    ...resetSelectionOn,
  ])

  const tabla = useReactTable({
    data,
    columns: columnasOrdenadas,
    pageCount,
    state: { sorting, columnVisibility, rowSelection, pagination },
    getRowId,
    enableRowSelection,
    manualPagination: true,
    manualFiltering: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const seleccionadas = tabla
    .getSelectedRowModel()
    .rows.map((fila) => fila.original)

  const filas = tabla.getRowModel().rows

  return (
    <div className='space-y-4'>
      {renderToolbar?.(tabla)}
      {renderBulkActions?.(seleccionadas, limpiarSeleccion)}

      {error ? (
        <ErrorDeTabla error={error} onRetry={onRetry} />
      ) : (
        <div
          className={cn(
            'rounded-md border transition-opacity',
            isFetching && !isLoading && 'opacity-60',
          )}
        >
          <Table>
            {/* Lo único que le dice a un lector de pantalla qué tabla es ésta. */}
            <caption className='sr-only'>{caption}</caption>

            <TableHeader>
              {tabla.getHeaderGroups().map((grupo) => (
                <TableRow key={grupo.id}>
                  {grupo.headers.map((encabezado) => {
                    const columna = encabezado.column
                    const orden = columna.getIsSorted()

                    return (
                      <TableHead
                        key={encabezado.id}
                        colSpan={encabezado.colSpan}
                        scope='col'
                        data-tipo={columna.columnDef.meta?.tipo}
                        // `aria-sort` es lo que permite a un lector de pantalla
                        // anunciar por qué columna está ordenada la tabla.
                        aria-sort={
                          !columna.getCanSort()
                            ? undefined
                            : orden === 'asc'
                              ? 'ascending'
                              : orden === 'desc'
                                ? 'descending'
                                : 'none'
                        }
                        className={columna.columnDef.meta?.className}
                      >
                        {encabezado.isPlaceholder
                          ? null
                          : flexRender(
                              columna.columnDef.header,
                              encabezado.getContext(),
                            )}
                        {columna.columnDef.meta?.unidad && (
                          <span className='text-muted-foreground block text-xs font-normal'>
                            {columna.columnDef.meta.unidad}
                          </span>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <FilasDeCarga
                  columnas={columnasOrdenadas.length}
                  filas={pagination.pageSize}
                />
              ) : filas.length ? (
                filas.map((fila) => (
                  <TableRow
                    key={fila.id}
                    data-state={fila.getIsSelected() && 'selected'}
                    {...rowProps?.(fila.original)}
                  >
                    {fila.getVisibleCells().map((celda) => (
                      <TableCell
                        key={celda.id}
                        data-tipo={celda.column.columnDef.meta?.tipo}
                        className={celda.column.columnDef.meta?.className}
                      >
                        {flexRender(
                          celda.column.columnDef.cell,
                          celda.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columnasOrdenadas.length}
                    className='text-muted-foreground h-24 text-center'
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>

            {renderFooter && !isLoading && filas.length > 0 && (
              <TableFooter>{renderFooter()}</TableFooter>
            )}
          </Table>
        </div>
      )}

      {/* Sin esto, quien usa lector de pantalla filtra y no se entera de nada:
          la tabla cambia en silencio. */}
      <p aria-live='polite' className='sr-only'>
        {isLoading
          ? 'Cargando resultados.'
          : error
            ? 'No se pudieron cargar los resultados.'
            : `${filas.length} resultado(s) en pantalla, página ${
                pagination.pageIndex + 1
              } de ${Math.max(pageCount, 1)}.`}
      </p>

      {!error && <DataTablePagination table={tabla} />}
    </div>
  )
}

function FilasDeCarga({
  columnas,
  filas,
}: {
  columnas: number
  filas: number
}) {
  // Se dibujan tantas filas como trae una página, para que el alto no salte
  // cuando llegan los datos.
  return (
    <>
      {Array.from({ length: Math.min(filas, 10) }).map((_, indiceFila) => (
        <TableRow key={indiceFila}>
          {Array.from({ length: columnas }).map((__, indiceColumna) => (
            <TableCell key={indiceColumna}>
              <Skeleton className='h-5 w-full' />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

function ErrorDeTabla({
  error,
  onRetry,
}: {
  error: Error
  onRetry?: () => void
}) {
  return (
    <div
      role='alert'
      className='border-destructive/50 text-destructive flex flex-col items-center gap-3 rounded-md border p-8 text-center'
    >
      <AlertCircle className='h-8 w-8' />
      <div>
        <p className='font-medium'>No se pudieron cargar los datos</p>
        <p className='text-muted-foreground mt-1 text-sm'>{error.message}</p>
      </div>
      {onRetry && (
        <Button variant='outline' size='sm' onClick={onRetry}>
          <RefreshCw className='mr-2 h-4 w-4' />
          Reintentar
        </Button>
      )}
    </div>
  )
}
