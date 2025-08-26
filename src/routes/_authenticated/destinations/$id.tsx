import { createFileRoute } from '@tanstack/react-router'
import { DestinationDetailsHeader } from '@/features/destinations/components/destination-details-header'
import { useGetDestination } from '@/features/destinations'
import { PageLayout } from '@/components/layout'

function DestinationDetailsPage() {
  const { id } = Route.useParams() as { id: string }
  
  // Hook para obtener el destino específico
  const { data: destination, isLoading, error } = useGetDestination(id)

  if (error) {
    return (
      <PageLayout
        title="Destinos"
        description="Gestiona los destinos de transporte."
        showSearch={false}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-lg font-medium text-destructive">Error al cargar el destino</p>
            <p className="text-sm text-muted-foreground mt-2">
              {error.message || 'Ocurrió un error inesperado'}
            </p>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout
      title="Destinos"
      description="Gestiona los destinos de transporte."
      showSearch={false}
    >
      <DestinationDetailsHeader 
        destination={destination} 
        loading={isLoading}
      />
    </PageLayout>
  )
}

export const Route = createFileRoute('/_authenticated/destinations/$id')({
  component: DestinationDetailsPage,
}) 