import * as React from 'react'
import {
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type Company } from '../models/company.model'
import { CompanyBulkActions } from './company-bulk-actions'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'

interface DataTableProps {
  columns: ColumnDef<Company>[]
  data: Company[]
  pageCount: number
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  search: string
  onSearchChange: (value: string) => void
  activo?: boolean
  onActivoChange: (value: boolean | undefined) => void
  /** Refetch en curso: se atenúa la tabla en vez de desmontarla. */
  isFetching?: boolean
}

export function DataTable({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  search,
  onSearchChange,
  activo,
  onActivoChange,
  isFetching = false,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [sorting, setSorting] = React.useState<SortingState>([])

  const orderedColumns = React.useMemo(() => {
    if (!columns?.length) return columns

    const actionsIndex = columns.findIndex((col) => col.id === 'actions')
    if (actionsIndex === -1) return columns

    const newColumns = [...columns]
    const [actionsColumn] = newColumns.splice(actionsIndex, 1)

    const hasSelectFirst = newColumns[0]?.id === 'select'

    if (hasSelectFirst) {
      newColumns.splice(1, 0, actionsColumn)
    } else {
      newColumns.unshift(actionsColumn)
    }

    return newColumns
  }, [columns])

  const clearSelection = React.useCallback(() => {
    setRowSelection((prev) => (Object.keys(prev).length ? {} : prev))
  }, [])

  // La selección se descarta al cambiar de página o de filtro: las filas
  // elegidas ya no están en pantalla y borrarlas a ciegas sería peligroso.
  React.useEffect(() => {
    clearSelection()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    search,
    activo,
    clearSelection,
  ])

  const table = useReactTable({
    data,
    columns: orderedColumns,
    pageCount,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      pagination,
    },
    // Sin esto la selección se indexa por posición de fila: al refetchear, la
    // clave "0" pasaría a apuntar a otra empresa.
    getRowId: (row) => row.id,
    enableRowSelection: true,
    manualPagination: true,
    // El backend resuelve búsqueda y filtros; no hay filtrado en el cliente.
    manualFiltering: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const selectedCompanies = table
    .getSelectedRowModel()
    .rows.map((row) => row.original)

  return (
    <div className='space-y-4'>
      <DataTableToolbar
        table={table}
        search={search}
        onSearchChange={onSearchChange}
        activo={activo}
        onActivoChange={onActivoChange}
      />
      <CompanyBulkActions
        selectedCompanies={selectedCompanies}
        onClearSelection={clearSelection}
      />
      <div
        className={cn(
          'rounded-md border transition-opacity',
          isFetching && 'opacity-60',
        )}
      >
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
