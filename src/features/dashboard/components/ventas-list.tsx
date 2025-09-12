import React from 'react'
import { type PaginationState } from '@tanstack/react-table'
import { useVentasList } from '../hooks/use-ventas-list'
import { VentasSearchParams } from '../models/sales.model'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VentasDataTable } from './ventas-data-table'
import { ventasColumns } from './ventas-columns'

interface VentasListProps {
  className?: string
}

export function VentasList({ className }: VentasListProps) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const searchParams: VentasSearchParams = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: 'fechaVenta',
    sortOrder: 'DESC'
  }

  const { data: ventasData, isLoading, error, refetch } = useVentasList(searchParams)

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Lista de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p>Error al cargar las ventas: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Lista de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex-1 space-y-4 p-8 pt-6'>
            <div className='flex items-center justify-between space-y-2'>
              <div>
                <Skeleton className='h-8 w-48 mb-2' />
                <Skeleton className='h-4 w-64' />
              </div>
              <Skeleton className='h-10 w-32' />
            </div>
            <div className='overflow-x-auto'>
              <div className='min-w-full border rounded-md bg-background'>
                {/* Header skeleton */}
                <div className='grid grid-cols-9 gap-4 px-2 py-3 border-b'>
                  <Skeleton className='h-5 w-5 rounded' />
                  <Skeleton className='h-5 w-32' />
                  <Skeleton className='h-5 w-20' />
                  <Skeleton className='h-5 w-24' />
                  <Skeleton className='h-5 w-24' />
                  <Skeleton className='h-5 w-24' />
                  <Skeleton className='h-5 w-16' />
                  <Skeleton className='h-5 w-16' />
                  <Skeleton className='h-5 w-8 rounded-full justify-self-end' />
                </div>
                {/* Filas skeleton */}
                {[...Array(6)].map((_, i) => (
                  <div key={i} className='grid grid-cols-9 gap-4 px-2 py-3 border-b last:border-b-0'>
                    <Skeleton className='h-5 w-5 rounded' />
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='h-5 w-20' />
                    <Skeleton className='h-5 w-24' />
                    <Skeleton className='h-5 w-24' />
                    <Skeleton className='h-5 w-24' />
                    <Skeleton className='h-5 w-16' />
                    <Skeleton className='h-5 w-16' />
                    <Skeleton className='h-8 w-8 rounded-full justify-self-end' />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Lista de Ventas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {ventasData && (
          <VentasDataTable
            columns={ventasColumns}
            data={ventasData.data}
            pageCount={ventasData.totalPages}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        )}
      </CardContent>
    </Card>
  )
}
