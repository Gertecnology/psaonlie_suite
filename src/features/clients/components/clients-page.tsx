import * as React from 'react'
import { DataTable, useTablaServidor } from '@/components/data-table'
import { PageLayout } from '@/components/layout/page-layout'
import { ClientsProvider } from '../context/clients-context'
import { useClientesList } from '../hooks/use-clients'
import { crearColumnasClientes } from './clients-columns'
import { ClientsDialogs } from './clients-dialogs'
import { ClientsPrimaryButtons } from './clients-primary-buttons'
import { ClientsToolbar } from './clients-toolbar'

/**
 * Client list.
 *
 * The page used to live in the feature's `index.tsx` with its own hand-rolled
 * debounce and its paging in `useState`. Page and search live in the URL now,
 * so a reload keeps the context and a filtered list can be shared as a link.
 */
export function ClientsPage() {
  const tabla = useTablaServidor()

  const { data, isLoading, isFetching, error, refetch } = useClientesList({
    page: tabla.parametrosApi.page,
    limit: tabla.parametrosApi.limit,
    termino: tabla.busquedaAplicada.trim() || undefined,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  })

  const columnas = React.useMemo(() => crearColumnasClientes(), [])

  const filas = React.useMemo(() => data?.data ?? [], [data?.data])

  return (
    <ClientsProvider>
      <PageLayout
        title='Clientes'
        description='Las personas que compran pasajes, con su historial de compras.'
        actions={<ClientsPrimaryButtons />}
      >
        {/* Carga y error se dibujan dentro de la tabla, no en lugar de la
            página: al fallar la consulta se perdían el encabezado, los botones
            y la navegación, y no quedaba forma de reintentar sin recargar. */}
        <DataTable
          columns={columnas}
          data={filas}
          getRowId={(fila) => fila.cliente.id}
          pageCount={Math.max(data?.totalPages ?? 1, 1)}
          pagination={tabla.pagination}
          onPaginationChange={tabla.onPaginationChange}
          caption='Listado de clientes y sus estadísticas de compras'
          emptyMessage='No se encontraron clientes.'
          emptyHint='Los clientes aparecen solos con cada venta; también podés cargarlos con «Nuevo Cliente».'
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={() => void refetch()}
          resetSelectionOn={[tabla.busquedaAplicada]}
          renderToolbar={(instancia) => (
            <ClientsToolbar
              table={instancia}
              busqueda={tabla.busqueda}
              onBusquedaChange={tabla.setBusqueda}
              hayFiltros={tabla.hayFiltros}
              onLimpiar={tabla.limpiarFiltros}
            />
          )}
        />
      </PageLayout>

      <ClientsDialogs />
    </ClientsProvider>
  )
}
