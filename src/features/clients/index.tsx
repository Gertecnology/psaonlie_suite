import { PageLayout } from '@/components/layout/page-layout'
import { columns } from './components/clients-columns'
import { ClientsDialogs } from './components/clients-dialogs'
import { ClientsPrimaryButtons } from './components/clients-primary-buttons'
import { ClientsTable } from './components/clients-table'
import { ClientsProvider } from './context/clients-context'
import { useClientesList } from './hooks/use-clients'
import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Clients() {
  const [pagination] = useState({
    page: 1,
    limit: 20,
    sortBy: 'createdAt' as const,
    sortOrder: 'DESC' as const,
  })

  const { data: clientesData, isLoading, error } = useClientesList(pagination)

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

  return (
    <ClientsProvider>
      <PageLayout
        title="Lista de Clientes"
        description="Gestiona tus clientes y sus estadísticas de ventas aquí."
        actions={<ClientsPrimaryButtons />}
      >
        <ClientsTable data={clientes} columns={columns} />
      </PageLayout>

      <ClientsDialogs />
    </ClientsProvider>
  )
}
