import { useEffect, useState } from 'react';
import { destinationColumns } from '@/features/destinations/components/columns';
import { DataTable } from '@/features/destinations/components/data-table';
import { DestinationMutateDrawer } from '@/features/destinations/components/destination-mutate-drawer';
import { useDestinationDialog, useDestinationDeleteDialog } from '@/features/destinations/store/use-destination-dialog';
import { getDestinations, deleteDestination } from '@/features/destinations/services/destination.service';
import { PaginationState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { createFileRoute } from '@tanstack/react-router';
import { DataTableToolbar } from '@/features/destinations/components/data-table-toolbar';
import { toast } from 'sonner';
import { PageLayout } from '@/components/layout';

export default function DestinationsPage() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 });
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const { open, isUpdate, data: editData, openDialog, close } = useDestinationDialog();
  const { open: openDelete, id: deleteId, close: closeDelete } = useDestinationDeleteDialog();

  const fetchData = async (params: Record<string, string> = {}) => {
    try {
      const res = await getDestinations({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        ...params,
      });
      setData(res as unknown as typeof data);
    } finally {
      // no-op
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDestination(deleteId);
      toast.success('Destino eliminado correctamente');
      closeDelete();
      fetchData();
    } catch (error) {
      toast.error('Error al eliminar destino', { description: error instanceof Error ? error.message : String(error) });
    }
  };

  return (
    <PageLayout
      title="Destinos"
      description="Gestiona los destinos de transporte y sus paradas homologadas."
      showSearch={true}
      actions={
        <Button onClick={() => openDialog('create')}>Nuevo destino</Button>
      }
    >
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable
            columns={destinationColumns}
            data={data.items}
            pageCount={data.totalPages}
            pagination={pagination}
            onPaginationChange={setPagination}
            renderToolbar={(table) => (
              <DataTableToolbar
                table={table}
                onFilterChange={(filters) => {
                  setPagination((p) => ({ ...p, pageIndex: 0 }))
                  fetchData(filters)
                }}
              />
            )}
          />
        </div>

      <DestinationMutateDrawer
        open={open}
        onClose={close}
        initialData={editData}
        isUpdate={isUpdate}
        onSuccess={fetchData}
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
      />
    </PageLayout>
  );
}

export const Route = createFileRoute('/_authenticated/destinations/')({
  component: DestinationsPage,
}); 