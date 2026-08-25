import * as React from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { DataTable, useTablaServidor } from '@/components/data-table'
import { PageLayout } from '@/components/layout'
import { useDeleteDestination } from '../hooks/use-delete-destination'
import { useGetDestinations } from '../hooks/use-get-destinations'
import { useDestinationDeleteDialog } from '../store/use-destination-delete-dialog'
import { destinationColumns } from './columns'
import { DestinationsToolbar } from './destinations-toolbar'

/**
 * Destination list.
 *
 * Page, search, status and sort order all live in the URL now. They used to be
 * local state written twice — once onto TanStack's column filters and once,
 * debounced, to the API — which double-filtered every page and lost the first
 * change of sort order to a stale closure.
 */
export function DestinationsPage() {
  const navigate = useNavigate()
  const { activo } = useSearch({ strict: false }) as { activo?: string }

  const tabla = useTablaServidor({ activo })

  const {
    open: abiertoBorrado,
    id: idABorrar,
    close: cerrarBorrado,
  } = useDestinationDeleteDialog()

  const parametros = React.useMemo(() => {
    const params: Record<string, string> = {
      page: String(tabla.parametrosApi.page),
      limit: String(tabla.parametrosApi.limit),
    }
    if (tabla.busquedaAplicada) params.search = tabla.busquedaAplicada
    if (activo) params.isActive = activo
    if (tabla.orden) {
      params.orderBy = tabla.orden
      params.sortOrder = (tabla.direccion ?? 'asc').toUpperCase()
    }
    return params
  }, [
    tabla.parametrosApi.page,
    tabla.parametrosApi.limit,
    tabla.busquedaAplicada,
    tabla.orden,
    tabla.direccion,
    activo,
  ])

  const { data, isLoading, isFetching, error, refetch } =
    useGetDestinations(parametros)

  const borrarDestino = useDeleteDestination()

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

  const confirmarBorrado = () => {
    if (!idABorrar) return
    borrarDestino.mutate(idABorrar, { onSuccess: cerrarBorrado })
  }

  return (
    <PageLayout
      title='Destinos'
      description='Las ciudades donde se vende pasaje y las paradas homologadas de cada una.'
      showSearch
      actions={
        // Crear un destino es una página con dirección propia, no un cajón:
        // se puede enlazar, sobrevive a una recarga y el botón "atrás" deshace
        // el paso en vez de descartar el formulario.
        <Button asChild>
          <Link to='/destinations/nuevo'>
            Crear destino <IconPlus size={18} />
          </Link>
        </Button>
      }
    >
      <DataTable
        columns={destinationColumns}
        data={data?.items ?? []}
        getRowId={(fila) => fila.id}
        pageCount={Math.max(data?.totalPages ?? 1, 1)}
        pagination={tabla.pagination}
        onPaginationChange={tabla.onPaginationChange}
        caption='Listado de destinos y sus paradas homologadas'
        emptyMessage='No hay destinos que coincidan con la búsqueda.'
        emptyHint='Creá el primero con «Crear destino» y asignale sus paradas homologadas.'
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={() => void refetch()}
        resetSelectionOn={[tabla.busquedaAplicada, activo]}
        renderToolbar={(instancia) => (
          <DestinationsToolbar
            table={instancia}
            busqueda={tabla.busqueda}
            onBusquedaChange={tabla.setBusqueda}
            activo={activo}
            onActivoChange={cambiarActivo}
            orden={tabla.orden}
            direccion={tabla.direccion}
            onOrdenChange={tabla.setOrden}
            hayFiltros={tabla.hayFiltros}
            onLimpiar={() => {
              tabla.limpiarFiltros()
              cambiarActivo(undefined)
            }}
          />
        )}
      />

      <ConfirmDialog
        destructive
        open={abiertoBorrado}
        onOpenChange={cerrarBorrado}
        handleConfirm={confirmarBorrado}
        className='max-w-md'
        title='¿Eliminar destino?'
        desc={
          <>
            Estás a punto de eliminar un destino.
            <br />
            Esta acción no se puede deshacer.
          </>
        }
        confirmText='Eliminar'
        cancelBtnText='Cancelar'
        isLoading={borrarDestino.isPending}
      />
    </PageLayout>
  )
}
