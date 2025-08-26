import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getDestinationById } from '@/features/destinations/services/destination.service'
import { DestinationDetailsHeader } from '@/features/destinations/components/destination-details-header'
import { DestinationParadasTable } from '@/features/destinations/components/destination-paradas-table'
import { Button } from '@/components/ui/button'
import { useRouter } from '@tanstack/react-router'
import { Destination } from '@/features/destinations/models/destination.model'
import { PageLayout } from '@/components/layout'

function DestinationDetailsPage() {
  const { id } = Route.useParams() as { id: string }
  const [destination, setDestination] = useState<Destination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { history } = useRouter()

  useEffect(() => {
    setLoading(true)
    setError(null)
    getDestinationById(id)
      .then(setDestination)
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Error fetching destination:', err)
        setError(err.message || 'Error al cargar el destino')
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <PageLayout
      title="Destinos"
      description="Gestiona los destinos de transporte."
      showSearch={false}
    >
    <div className='min-h-screen w-full bg-background flex flex-col'>
      <div className='flex-1 w-full flex flex-col'>
        <div className='flex items-center gap-4 p-4 sm:p-6 border-b'>
          <Button variant="outline" onClick={() => history.go(-1)}>
            ← Volver
          </Button>
          <h2 className='text-2xl font-bold'>Detalles de destino</h2>
        </div>
        <div className='flex flex-col'>
          {error ? (
            <div className='bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md m-6'>
              <p className='font-medium'>Error al cargar el destino</p>
              <p className='text-sm mt-1'>{error}</p>
            </div>
          ) : (
            <>
              <DestinationDetailsHeader destination={destination} loading={loading} />
              {destination && <DestinationParadasTable destinationId={destination.id} />}
            </>
          )}
        </div>
      </div>
    </div>
    </PageLayout>
  )
}

export const Route = createFileRoute('/_authenticated/destinations/$id')({
  component: DestinationDetailsPage,
}) 