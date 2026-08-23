import * as React from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { DataTable, useTablaServidor } from '@/components/data-table'
import UsersProvider from '../context/users-context'
import { useUsers } from '../hooks/use-users'
import { columns } from './users-columns'
import { UsersDialogs } from './users-dialogs'
import { UsersPrimaryButtons } from './users-primary-buttons'
import { UsersToolbar } from './users-toolbar'

/**
 * User list.
 *
 * Search and the status filter now reach the API. They used to be TanStack
 * column filters on top of server-side paging, which meant they only matched
 * among the ten rows already on screen — a user on page four could not be
 * found at all.
 */
export function UsersPage() {
  const navigate = useNavigate()
  const { activo } = useSearch({ strict: false }) as { activo?: string }

  const tabla = useTablaServidor({ activo })

  const { data, isLoading, isFetching, error, refetch } = useUsers({
    page: tabla.parametrosApi.page,
    limit: tabla.parametrosApi.limit,
    search: tabla.busquedaAplicada || undefined,
    isActive: activo === undefined ? undefined : activo === 'true',
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  })

  const cambiarActivo = (valor: string | undefined) => {
    void navigate({
      // @ts-expect-error el esquema de búsqueda lo declara la ruta.
      search: (previa: Record<string, unknown>) => {
        const siguiente: Record<string, unknown> = { ...previa, activo: valor }
        if (!valor) delete siguiente.activo
        delete siguiente.pagina
        return siguiente
      },
      replace: true,
    })
  }

  const filas = React.useMemo(() => data?.data ?? [], [data?.data])

  return (
    <UsersProvider>
      <PageLayout
        title='Lista de usuarios'
        description='Gestiona tus usuarios y sus roles aquí.'
        actions={<UsersPrimaryButtons />}
      >
        <DataTable
          columns={columns}
          data={filas}
          getRowId={(fila) => fila.id}
          pageCount={Math.max(data?.totalPages ?? 1, 1)}
          pagination={tabla.pagination}
          onPaginationChange={tabla.onPaginationChange}
          caption='Listado de usuarios del panel y sus roles'
          emptyMessage='No se encontraron usuarios.'
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={() => void refetch()}
          resetSelectionOn={[tabla.busquedaAplicada, activo]}
          renderToolbar={(instancia) => (
            <UsersToolbar
              table={instancia}
              busqueda={tabla.busqueda}
              onBusquedaChange={tabla.setBusqueda}
              activo={activo}
              onActivoChange={cambiarActivo}
              hayFiltros={tabla.hayFiltros}
              onLimpiar={() => {
                tabla.limpiarFiltros()
                cambiarActivo(undefined)
              }}
            />
          )}
        />
      </PageLayout>

      <UsersDialogs />
    </UsersProvider>
  )
}
