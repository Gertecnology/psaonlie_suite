import { useEffect, useState } from 'react';
import { destinationColumns } from '@/features/destinations/components/columns';
import { DataTable } from '@/features/destinations/components/data-table';
import { DestinationMutateDrawer } from '@/features/destinations/components/destination-mutate-drawer';
import { useDestinationDialog, useDestinationDeleteDialog } from '@/features/destinations/store/use-destination-dialog';
import { getDestinations, deleteDestination } from '@/features/destinations/services/destination.service';
import { PaginationState } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';

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
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Destinos</h2>
            <p className='text-muted-foreground'>
              Gestiona los destinos y sus paradas homologadas.
            </p>
          </div>
          <Button onClick={() => openDialog('create')}>Nuevo destino</Button>
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable
            columns={destinationColumns}
            data={data.items}
            pageCount={data.totalPages}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        </div>
      </Main>

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
    </>
  );
}

export const Route = createFileRoute('/_authenticated/destinations/')({
  component: DestinationsPage,
}); 