import React from 'react'
import { type PaginationState } from '@tanstack/react-table'
import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { DataTable } from '@/features/companies/components/data-table'
import { companyColumns } from '@/features/companies/components/columns'
import { useGetCompanies } from '@/features/companies/hooks/use-get-companies'
import { CompanyMutateDrawer } from '@/features/companies/components/company-mutate-drawer'
import { CompanyDialogs } from '@/features/companies/components/company-dialogs'
import { CompanyPrimaryButtons } from '@/features/companies/components/company-primary-buttons'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function CompaniesPage() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  // La búsqueda y el filtro viven acá porque son parámetros de la consulta al
  // servidor, no filtros de la tabla.
  const [search, setSearch] = React.useState('')
  const [activo, setActivo] = React.useState<boolean | undefined>(undefined)

  const debouncedSearch = useDebouncedValue(search, 350)

  // Al cambiar la búsqueda o el filtro hay que volver a la primera página: con
  // menos resultados, la página actual puede dejar de existir y la tabla queda
  // vacía sin explicación. Se hace en el handler y no en un efecto para no
  // disparar una consulta intermedia contra una página inexistente.
  const resetToFirstPage = () => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    )
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    resetToFirstPage()
  }

  const handleActivoChange = (value: boolean | undefined) => {
    setActivo(value)
    resetToFirstPage()
  }

  const { data, isLoading, isFetching, error } = useGetCompanies({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    nombre: debouncedSearch.trim() || undefined,
    activo,
  })

  if (isLoading) return (
    <PageLayout
      title="Empresas"
      description="Gestiona las empresas de transporte."
      actions={<CompanyPrimaryButtons />}
    >
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
            <div className='grid grid-cols-8 gap-4 px-2 py-3 border-b'>
              <Skeleton className='h-5 w-5 rounded' />
              <Skeleton className='h-5 w-32' />
              <Skeleton className='h-5 w-20' />
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-5 w-24' />
              <Skeleton className='h-5 w-16' />
              <Skeleton className='h-5 w-8 rounded-full justify-self-end' />
            </div>
            {/* Filas skeleton */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className='grid grid-cols-8 gap-4 px-2 py-3 border-b last:border-b-0'>
                <Skeleton className='h-5 w-5 rounded' />
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-5 w-20' />
                <Skeleton className='h-5 w-24' />
                <Skeleton className='h-5 w-24' />
                <Skeleton className='h-5 w-24' />
                <Skeleton className='h-5 w-16' />
                <Skeleton className='h-8 w-8 rounded-full justify-self-end' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )

  return (
    <>
      <PageLayout
        title="Empresas"
        description="Gestiona las empresas de transporte."
        actions={<CompanyPrimaryButtons />}
      >
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertTitle>No se pudo cargar el listado</AlertTitle>
            <AlertDescription>
              {error.message ||
                'Ocurrió un error al obtener las empresas. Intentá nuevamente.'}
            </AlertDescription>
          </Alert>
        )}
        {/* La tabla se renderiza aunque la consulta falle: si no, el usuario
            pierde el buscador y no puede deshacer el filtro que la rompió. */}
        <DataTable
          columns={companyColumns}
          data={data?.items ?? []}
          pageCount={Math.max(data?.totalPages ?? 1, 1)}
          pagination={pagination}
          onPaginationChange={setPagination}
          search={search}
          onSearchChange={handleSearchChange}
          activo={activo}
          onActivoChange={handleActivoChange}
          isFetching={isFetching}
        />
      </PageLayout>

      <CompanyMutateDrawer />
      <CompanyDialogs />
    </>
  )
}

export const Route = createFileRoute('/_authenticated/companies/')({
  component: CompaniesPage,
})
