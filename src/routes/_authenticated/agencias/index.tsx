import React from 'react'
import { type PaginationState } from '@tanstack/react-table'
import { createFileRoute } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { DataTable } from '@/features/agencias/components/data-table'
import { crearColumnasAgencias } from '@/features/agencias/components/columns'
import { useAgencias } from '@/features/agencias/hooks/use-agencias'
import { useHijas } from '@/features/agencias/hooks/use-hijas'
import { AgenciaMutateDrawer } from '@/features/agencias/components/agencia-mutate-drawer'
import { AgenciaDialogs } from '@/features/agencias/components/agencia-dialogs'
import { AgenciaPrimaryButtons } from '@/features/agencias/components/agencia-primary-buttons'
import { aplanarJerarquia } from '@/features/agencias/models/agencia.model'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function AgenciasPage() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  // La búsqueda y el filtro viven acá porque son parámetros de la consulta al
  // servidor, no filtros de la tabla.
  const [search, setSearch] = React.useState('')
  const [activo, setActivo] = React.useState<boolean | undefined>(undefined)
  // Qué empresas tienen sus agencias desplegadas. Es estado de la vista, no del
  // servidor: el listado siempre trae las dos ramas.
  const [expandidas, setExpandidas] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  )

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

  const handleToggleExpandir = React.useCallback((id: string) => {
    setExpandidas((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })
  }, [])

  const { data, isLoading, isFetching, error } = useAgencias({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    nombre: debouncedSearch.trim() || undefined,
    activo,
  })

  // Las hijas completas —con `heredaComision` y su comisión propia— sólo se
  // piden para las empresas desplegadas: el listado las embebe con un DTO
  // reducido que no alcanza para decir qué comisión cobra cada una.
  const hijasCompletas = useHijas(expandidas)

  const columnas = React.useMemo(
    () =>
      crearColumnasAgencias({
        expandidas,
        onToggleExpandir: handleToggleExpandir,
      }),
    [expandidas, handleToggleExpandir],
  )

  const filas = React.useMemo(
    () => aplanarJerarquia(data?.items ?? [], expandidas, hijasCompletas),
    [data?.items, expandidas, hijasCompletas],
  )

  if (isLoading) return (
    <PageLayout
      title="Empresas y agencias"
      description="Gestiona las empresas de transporte y sus agencias."
      actions={<AgenciaPrimaryButtons />}
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
        title="Empresas y agencias"
        description="Gestiona las empresas de transporte y sus agencias."
        actions={<AgenciaPrimaryButtons />}
      >
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertTitle>No se pudo cargar el listado</AlertTitle>
            <AlertDescription>
              {error.message ||
                'Ocurrió un error al obtener las agencias. Intentá nuevamente.'}
            </AlertDescription>
          </Alert>
        )}
        {/* La tabla se renderiza aunque la consulta falle: si no, el usuario
            pierde el buscador y no puede deshacer el filtro que la rompió. */}
        <DataTable
          columns={columnas}
          data={filas}
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

      <AgenciaMutateDrawer />
      <AgenciaDialogs />
    </>
  )
}

export const Route = createFileRoute('/_authenticated/agencias/')({
  component: AgenciasPage,
})
