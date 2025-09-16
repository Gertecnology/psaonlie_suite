import { useState } from 'react'
import { PageLayout } from '@/components/layout/page-layout'
import { columns } from './components/clients-columns'
import { ClientsDialogs } from './components/clients-dialogs'
import { ClientsPrimaryButtons } from './components/clients-primary-buttons'
import { DataTable } from './components/data-table'
import { ClientDetailsScreen } from './components/client-details-screen'
import { ClientsProvider } from './context/clients-context'
import { useClientesList } from './hooks/use-clients'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClienteConEstadisticas } from './models/clients.model'

export default function Clients() {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  })

  const [selectedClient, setSelectedClient] = useState<ClienteConEstadisticas | null>(null)

  const searchParams = {
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    sortBy: 'createdAt' as const,
    sortOrder: 'DESC' as const,
  }

  const { data: clientesData, isLoading, error } = useClientesList(searchParams)

  const handleBackToList = () => {
    setSelectedClient(null)
  }

  const handleViewClientDetails = (client: ClienteConEstadisticas) => {
    setSelectedClient(client)
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error al cargar los clientes</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando clientes...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const clientes = clientesData?.data || []
  const pageCount = clientesData?.totalPages || 0

  // Si hay un cliente seleccionado, mostrar la pantalla de detalles
  if (selectedClient) {
    return (
      <ClientsProvider>
        <ClientDetailsScreen 
          client={selectedClient} 
          onBack={handleBackToList}
        />
        <ClientsDialogs />
      </ClientsProvider>
    )
  }

  // Mostrar la lista de clientes
  return (
    <ClientsProvider>
      <PageLayout
        title="Lista de Clientes"
        description="Gestiona tus clientes y sus estadísticas de ventas aquí."
        actions={<ClientsPrimaryButtons />}
      >
        <DataTable
          data={clientes}
          columns={columns}
          pageCount={pageCount}
          pagination={pagination}
          onPaginationChange={setPagination}
          onViewClientDetails={handleViewClientDetails}
        />
      </PageLayout>

      <ClientsDialogs />
    </ClientsProvider>
  )
}