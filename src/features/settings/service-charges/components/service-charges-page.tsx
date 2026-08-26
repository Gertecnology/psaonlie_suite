import * as React from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { DataTable, useTablaServidor } from '@/components/data-table'
import { PageLayout } from '@/components/layout/page-layout'
import { useGetServiceCharges } from '../hooks/use-get-service-charges'
import { columns } from './columns'
import { ServiceChargesDialogs } from './service-charges-dialogs'
import { ServiceChargesPrimaryButtons } from './service-charges-primary-buttons'
import { ServiceChargesToolbar } from './service-charges-toolbar'

/** The three facets, as they travel in the URL. Booleans go as text. */
interface FiltrosServiceCharges {
  tipoAplicacion?: 'PORCENTUAL' | 'FIJO'
  esGlobal?: string
  activo?: string
}

/**
 * Service charge list.
 *
 * The page used to hand a server-paged list to a table that still ran
 * `getFilteredRowModel`, so TanStack filtered the ten rows the API had already
 * chosen and hid some of them behind a pager that kept counting them. Filters
 * reach the API now, and the shared table no longer filters what it receives.
 */
export function ServiceChargesPage() {
  const navigate = useNavigate()
  const { tipoAplicacion, esGlobal, activo } = useSearch({
    strict: false,
  }) as FiltrosServiceCharges

  const tabla = useTablaServidor({ tipoAplicacion, esGlobal, activo })

  const cambiarFiltro = React.useCallback(
    (clave: keyof FiltrosServiceCharges, valor: string | undefined) => {
      void navigate({
        // @ts-expect-error el esquema de búsqueda lo declara la ruta.
        search: (previa: Record<string, unknown>) => {
          const siguiente: Record<string, unknown> = {
            ...previa,
            [clave]: valor,
          }
          if (valor === undefined) delete siguiente[clave]
          // Cambiar un filtro cambia el conjunto: quedarse en la página 7
          // mostraría una tabla vacía sin explicación.
          delete siguiente.pagina
          return siguiente
        },
        replace: true,
      })
    },
    [navigate]
  )

  const { data, isLoading, isFetching, error, refetch } = useGetServiceCharges({
    page: tabla.parametrosApi.page,
    limit: tabla.parametrosApi.limit,
    nombre: tabla.busquedaAplicada.trim() || undefined,
    tipoAplicacion,
    // El filtro es de tres estados —sí, no, sin filtrar—, así que `false` sólo
    // se distingue de "sin filtrar" comparando contra `undefined`.
    esGlobal: esGlobal === undefined ? undefined : esGlobal === 'true',
    activo: activo === undefined ? undefined : activo === 'true',
  })

  const filas = React.useMemo(() => data?.items ?? [], [data?.items])

  return (
    <>
      <PageLayout
        title='Cargos por servicio'
        description='Lo que el sistema suma al precio del pasaje, con su porcentaje o monto y su vigencia.'
        // Se mantiene oculto el buscador global, como cuando la página colgaba
        // del layout de configuración.
        showSearch={false}
      >
        <DataTable
          columns={columns}
          data={filas}
          getRowId={(fila) => fila.id}
          pageCount={Math.max(data?.totalPages ?? 1, 1)}
          pagination={tabla.pagination}
          onPaginationChange={tabla.onPaginationChange}
          caption='Listado de cargos por servicio del sistema'
          emptyMessage='No se encontraron cargos por servicio.'
          emptyHint='Creá el primero con «Nuevo cargo»; aplica a las ventas dentro de su vigencia.'
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={() => void refetch()}
          resetSelectionOn={[
            tabla.busquedaAplicada,
            tipoAplicacion,
            esGlobal,
            activo,
          ]}
          renderToolbar={(instancia) => (
            <ServiceChargesToolbar
              table={instancia}
              busqueda={tabla.busqueda}
              onBusquedaChange={tabla.setBusqueda}
              tipoAplicacion={tipoAplicacion}
              onTipoAplicacionChange={(valor) =>
                cambiarFiltro('tipoAplicacion', valor)
              }
              esGlobal={esGlobal}
              onEsGlobalChange={(valor) => cambiarFiltro('esGlobal', valor)}
              activo={activo}
              onActivoChange={(valor) => cambiarFiltro('activo', valor)}
              hayFiltros={tabla.hayFiltros}
              onLimpiar={tabla.limpiarFiltros}
              actions={<ServiceChargesPrimaryButtons />}
            />
          )}
        />
      </PageLayout>

      <ServiceChargesDialogs />
    </>
  )
}
