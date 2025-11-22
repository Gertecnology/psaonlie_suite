import { useState } from 'react';
import { destinationColumns } from '@/features/destinations/components/columns';
import { DataTable } from '@/features/destinations/components/data-table';
import { DestinationMutateDrawer } from '@/features/destinations/components/destination-mutate-drawer';
import { useDestinationDialog, useDestinationDeleteDialog } from '@/features/destinations/store/use-destination-dialog';
import { useGetDestinations, useDeleteDestination } from '@/features/destinations';
import { PaginationState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { createFileRoute } from '@tanstack/react-router';
import { DataTableToolbar } from '@/features/destinations/components/data-table-toolbar';
import { PageLayout } from '@/components/layout';
import { IconPlus } from '@tabler/icons-react';

export default function DestinationsPage() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [filters, setFilters] = useState<Record<string, string>>({});

  const { open, isUpdate, data: editData, openDialog, close } = useDestinationDialog();
  const { open: openDelete, id: deleteId, close: closeDelete } = useDestinationDeleteDialog();

  // Hook para obtener destinos con paginación y filtros
  const { data, error, refetch } = useGetDestinations({
    page: String(pagination.pageIndex + 1),
    limit: String(pagination.pageSize),
    ...filters,
  });

  // Hook para eliminar destino
  const deleteDestination = useDeleteDestination();

  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleDelete = () => {
    if (!deleteId) return;
    
    deleteDestination.mutate(deleteId, {
      onSuccess: () => {
        closeDelete();
        refetch(); // Refetch después de eliminar
      },
    });
  };

  if (error) {
    return (
      <PageLayout
        title="Destinos"
        description="Gestiona los destinos de transporte y sus paradas homologadas."
        showSearch={true}
        actions={
          <Button onClick={() => openDialog('create')}>Crear destino <IconPlus size={18} /></Button>
        }
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-destructive">Error al cargar destinos</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message || 'Ocurrió un error inesperado'}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetch()}
            >
              Reintentar
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title="Destinos"
      description="Gestiona los destinos de transporte y sus paradas homologadas."
      showSearch={true}
      actions={
        <Button onClick={() => openDialog('create')}>Crear destino <IconPlus size={18} /></Button>
      }
    >
      <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
        <DataTable
          columns={destinationColumns}
          data={data?.items || []}
          pageCount={data?.totalPages || 1}
          pagination={pagination}
          onPaginationChange={setPagination}
          renderToolbar={(table) => (
            <DataTableToolbar
              table={table}
              onFilterChange={handleFilterChange}
            />
          )}
        />
      </div>

      <DestinationMutateDrawer
        open={open}
        onClose={close}
        initialData={editData}
        isUpdate={isUpdate}
        onSuccess={refetch}
      />

      {/* Diálogo de confirmación de borrado */}
      <ConfirmDialog
        destructive
        open={openDelete}
        onOpenChange={closeDelete}
        handleConfirm={handleDelete}
        className="max-w-md"
        title="¿Eliminar destino?"
        desc={
          <>
            Estás a punto de eliminar un destino.<br />
            Esta acción no se puede deshacer.
          </>
        }
        confirmText="Eliminar"
        cancelBtnText="Cancelar"
        isLoading={deleteDestination.isPending}
      />
    </PageLayout>
  );
}

export const Route = createFileRoute('/_authenticated/destinations/')({
  component: DestinationsPage,
}); 