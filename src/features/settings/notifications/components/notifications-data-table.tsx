import * as React from 'react'
import {
  type ColumnDef,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type NotificationResponse } from '@/services/notifications'
import { DataTablePagination } from '@/features/companies/components/data-table-pagination'
import { NotificationsTableToolbar } from './notifications-table-toolbar'

interface NotificationsDataTableProps {
  columns: ColumnDef<NotificationResponse>[]
  data: NotificationResponse[]
  pageCount: number
  pagination: PaginationState
  onPaginationChange: OnChangeFn<PaginationState>
  onFilterChange?: (filters: Record<string, string>) => void
  onMarkAllAsRead?: () => void
  unreadCount?: number
}

export function NotificationsDataTable({
  columns,
  data,
  pageCount,
  pagination,
  onPaginationChange,
  onFilterChange,
  onMarkAllAsRead,
  unreadCount,
}: NotificationsDataTableProps) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    manualPagination: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  return (
    <div className='h-full flex flex-col space-y-4'>
      <NotificationsTableToolbar 
        table={table} 
        onFilterChange={onFilterChange}
        onMarkAllAsRead={onMarkAllAsRead}
        unreadCount={unreadCount}
      />
      <div className='flex-1 rounded-md border overflow-hidden bg-card'>
        <div className='h-full overflow-auto'>
          <Table className='w-full'>
            <TableHeader className='sticky top-0 bg-background z-10'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className='border-b'>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead 
                        key={header.id} 
                        colSpan={header.colSpan} 
                        className='whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground'
                      >
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
                    className={`border-b hover:bg-muted/50 transition-colors`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className='px-4 py-3'>
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
                    className='h-24 text-center text-muted-foreground'
                  >
                    No hay notificaciones.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
