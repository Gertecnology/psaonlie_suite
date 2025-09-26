import { useState, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ServiciosList } from './servicios-list'
import { useGetServicios } from '../hooks/use-get-servicios'
import { useRoundTrip } from '../context/round-trip-context'
import type { SearchFilters } from '../models/sales.model'

export function ServiciosVueltaPage() {
  const { roundTripData, setRoundTripData, setCurrentStep } = useRoundTrip()
  const [shouldSearch] = useState(true)
  const [filters] = useState<SearchFilters>({
    asientosMinimos: 2,
  })

  // Build search parameters for vuelta
  const searchParams = useMemo(() => {
    if (!roundTripData.vuelta?.origen || !roundTripData.vuelta?.destino || !roundTripData.vuelta?.fecha) {
      return null
    }

    const fechaFormatted = roundTripData.vuelta.fecha.toISOString().split('T')[0]
    
    return {
      origenDestinoId: roundTripData.vuelta.origen.id,
      destinoDestinoId: roundTripData.vuelta.destino.id,
      fecha: fechaFormatted,
      ...filters,
    }
  }, [roundTripData.vuelta, filters])

  const { data: servicios, isLoading, error } = useGetServicios(searchParams || {
    origenDestinoId: '',
    destinoDestinoId: '',
    fecha: '',
  }, shouldSearch)

  const handleGoBack = () => {
    setCurrentStep('ida-seats')
  }

  if (!roundTripData.vuelta?.origen || !roundTripData.vuelta?.destino || !roundTripData.vuelta?.fecha) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertDescription>
            No se encontró información del viaje de vuelta. Por favor, vuelve a la búsqueda.
          </AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={handleGoBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Seleccionar Servicio de Vuelta</h1>
          <p className="text-muted-foreground">
            {roundTripData.vuelta.origen.nombre} → {roundTripData.vuelta.destino.nombre} • {roundTripData.vuelta.fecha.toISOString().split('T')[0]}
          </p>
        </div>
      </div>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Servicios Disponibles para Vuelta
            {servicios && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({servicios.reduce((total, empresa) => total + empresa.data.length, 0)} servicios encontrados)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8">
              <p className="text-destructive mb-2">Error al buscar servicios</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          )}

          <ServiciosList
            data={servicios || []}
            isLoading={isLoading}
            origen={roundTripData.vuelta.origen}
            destino={roundTripData.vuelta.destino}
            onServiceSelect={(servicio, empresaId, serviceCharge) => {
              // Guardar el servicio de vuelta seleccionado
              setRoundTripData({
                vuelta: {
                  ...roundTripData.vuelta,
                  servicio: servicio,
                  empresaId: empresaId,
                  serviceCharge: serviceCharge
                }
              })
              // Ir a selección de asientos de vuelta
              setCurrentStep('vuelta-seats')
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
