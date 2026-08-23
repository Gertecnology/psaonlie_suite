import * as React from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { PageLayout } from '@/components/layout/page-layout'
import { DataTable, useTablaServidor } from '@/components/data-table'
import { aplanarJerarquia, esEmpresa } from '../models/agencia.model'
import { useAgencias } from '../hooks/use-agencias'
import { useHijas } from '../hooks/use-hijas'
import { crearColumnasAgencias } from './columns'
import { AgenciaBulkActions } from './agencia-bulk-actions'
import { AgenciaDialogs } from './agencia-dialogs'
import { AgenciaPrimaryButtons } from './agencia-primary-buttons'
import { AgenciasToolbar } from './agencias-toolbar'

/**
 * Companies and their agencies.
 *
 * The page used to live inside the route file with 45 lines of inline skeleton
 * markup and all of its state in `useState`. It sits in the feature now, and
 * page, search and status filter live in the URL — so F5 keeps the context and
 * coming back from a detail page returns you to where you were, not to page 1.
 */
export function AgenciasPage() {
  const navigate = useNavigate()
  const { activo } = useSearch({ strict: false }) as { activo?: boolean }

  const tabla = useTablaServidor({ activo })

  // Qué empresas tienen sus agencias desplegadas. Es estado de la vista, no del
  // servidor, así que no va a la URL: el listado siempre trae las dos ramas.
  const [expandidas, setExpandidas] = React.useState<ReadonlySet<string>>(
    () => new Set(),
  )

  const cambiarActivo = (valor: boolean | undefined) => {
    void navigate({
      // @ts-expect-error el esquema de búsqueda lo declara la ruta.
      search: (previa: Record<string, unknown>) => {
        const siguiente: Record<string, unknown> = { ...previa, activo: valor }
        if (valor === undefined) delete siguiente.activo
        // Cambiar el filtro cambia el conjunto: quedarse en la página 7 daría
        // una tabla vacía sin explicación.
        delete siguiente.pagina
        return siguiente
      },
      replace: true,
    })
  }

  const alternarExpandir = React.useCallback((id: string) => {
    setExpandidas((previa) => {
      const siguiente = new Set(previa)
      if (siguiente.has(id)) siguiente.delete(id)
      else siguiente.add(id)
      return siguiente
    })
  }, [])

  const { data, isLoading, isFetching, error, refetch } = useAgencias({
    page: tabla.parametrosApi.page,
    limit: tabla.parametrosApi.limit,
    nombre: tabla.busquedaAplicada.trim() || undefined,
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
        onToggleExpandir: alternarExpandir,
      }),
    [expandidas, alternarExpandir],
  )

  const filas = React.useMemo(
    () => aplanarJerarquia(data?.items ?? [], expandidas, hijasCompletas),
    [data?.items, expandidas, hijasCompletas],
  )

  return (
    <>
      <PageLayout
        title='Empresas y agencias'
        description='Gestiona las empresas de transporte y sus agencias.'
        actions={<AgenciaPrimaryButtons />}
      >
        <DataTable
          columns={columnas}
          data={filas}
          getRowId={(fila) => fila.id}
          pageCount={Math.max(data?.totalPages ?? 1, 1)}
          pagination={tabla.pagination}
          onPaginationChange={tabla.onPaginationChange}
          caption='Listado de empresas de transporte y sus agencias'
          // Lo que se necesita para operar: nombre, estado, stock, comisión y
          // cargo. Los datos de la conexión al web service se ven al editar la
          // empresa, que es donde se cambian.
          columnasOcultasPorDefecto={['usuario', 'agenciaPrincipal', 'url']}
          isLoading={isLoading}
          isFetching={isFetching}
          error={error}
          onRetry={() => void refetch()}
          resetSelectionOn={[tabla.busquedaAplicada, activo]}
          // Una agencia hija no se puede borrar sola, así que tampoco se
          // selecciona: sólo llevaría a un borrado que el backend rechaza.
          enableRowSelection={(fila) => esEmpresa(fila.original)}
          rowProps={(fila) => ({
            'data-nivel': fila.nivel,
            className: fila.nivel === 1 ? 'bg-muted/30' : undefined,
          })}
          renderToolbar={(instancia) => (
            <AgenciasToolbar
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
          renderBulkActions={(seleccionadas, limpiarSeleccion) => (
            <AgenciaBulkActions
              seleccionadas={seleccionadas}
              onClearSelection={limpiarSeleccion}
            />
          )}
        />
      </PageLayout>

      <AgenciaDialogs />
    </>
  )
}
