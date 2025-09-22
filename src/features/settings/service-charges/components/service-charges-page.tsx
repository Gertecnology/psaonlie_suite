import { useState } from 'react'
import { type PaginationState } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ServiceChargeDataTable } from '../components/data-table'
import { columns } from '../components/columns'
import { ServiceChargesDialogs } from '../components/service-charges-dialogs'
import { ServiceChargesPrimaryButtons } from '../components/service-charges-primary-buttons'
import { useGetServiceCharges } from '../hooks/use-get-service-charges'

export function ServiceChargesPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data: serviceCharges, isLoading, error } = useGetServiceCharges({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  })

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error al cargar los cargos por servicio</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando cargos por servicio...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const items = serviceCharges?.items || []
  const pageCount = serviceCharges?.totalPages || 0

  return (
    <div className='h-full flex flex-col'>
      <div className='space-y-0.5 mb-6'>
        <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
          Cargos por Servicio
        </h1>
        <p className='text-muted-foreground'>
          Gestiona los cargos por servicio del sistema, configura porcentajes y montos fijos.
        </p>
      </div>
      
      <ServiceChargeDataTable
        data={items}
        columns={columns}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
        actions={<ServiceChargesPrimaryButtons />}
      />

      <ServiceChargesDialogs />
    </div>
  )
}
