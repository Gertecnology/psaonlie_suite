import { useEffect, useState } from 'react';
import { destinationColumns } from '@/features/destinations/components/columns';
import { DataTable } from '@/features/destinations/components/data-table';
import { DestinationMutateDrawer } from '@/features/destinations/components/company-mutate-drawer';
import { useDestinationDialog, useDestinationDeleteDialog } from '@/features/destinations/store/use-destination-dialog';
import { getDestinations, deleteDestination } from '@/features/destinations/services/destination.service';
import { PaginationState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';

export default function DestinationsPage() {
  const [data, setData] = useState({ items: [], total: 0, page: 1, limit: 10, totalPages: 1 });
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const { open, isUpdate, data: editData, openDialog, close } = useDestinationDialog();
  const { open: openDelete, id: deleteId, close: closeDelete } = useDestinationDeleteDialog();

  const fetchData = async () => {
    try {
      const res = await getDestinations({ page: String(pagination.pageIndex + 1), limit: String(pagination.pageSize) });
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
      closeDelete();
      fetchData();
    } catch (error) {
      import('sonner').then(({ toast }) => {
        toast.error('Error al eliminar destino', { description: error instanceof Error ? error.message : String(error) });
      });
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Destinos</h2>
        <Button onClick={() => openDialog('create')}>Nuevo destino</Button>
      </div>
      <DataTable
        columns={destinationColumns}
        data={data.items}
        pageCount={data.totalPages}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
      <DestinationMutateDrawer
        open={open}
        onClose={close}
        initialData={editData}
        isUpdate={isUpdate}
        onSuccess={fetchData}
      />
      {/* Diálogo de confirmación de borrado */}
      {openDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">¿Eliminar destino?</h3>
            <p className="mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDelete}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute('/_authenticated/destinations/')({
  component: DestinationsPage,
}); 