import { useState } from 'react'
import { type PaginationState } from '@tanstack/react-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceChargeDataTable } from '../components/data-table'
import { columns } from '../components/columns'
import { ServiceChargeMutateDrawer } from '../components/service-charge-mutate-drawer'
import { useGetServiceCharges } from '../hooks/use-get-service-charges'

export function ServiceChargesPage() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data: serviceCharges, error } = useGetServiceCharges({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  })

  if (error) {
    return (
      <div className='flex items-center justify-center p-6'>
        <Card className='w-full max-w-md'>
          <CardContent className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <h3 className='text-lg font-semibold text-destructive mb-2'>
                Error al cargar los cargos por servicio
              </h3>
              <p className='text-muted-foreground'>
                {error instanceof Error ? error.message : 'Ha ocurrido un error inesperado'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='h-full flex flex-col'>
      <Card className='flex-1 flex flex-col'>
        <CardHeader>
          <CardTitle>Cargos por Servicio</CardTitle>
        </CardHeader>
        <CardContent className='flex-1 p-0 overflow-hidden'>
          <div className='h-full p-6'>
            <ServiceChargeDataTable
              columns={columns}
              data={serviceCharges?.items || []}
              pageCount={serviceCharges?.totalPages || 0}
              pagination={pagination}
              onPaginationChange={setPagination}
            />
          </div>
        </CardContent>
      </Card>

      <ServiceChargeMutateDrawer />
    </div>
  )
}
