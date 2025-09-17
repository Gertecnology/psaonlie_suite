import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Info, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SeatGrid } from './seat-grid'
import { ServiceInfo } from './service-info'
import { SeatLegend } from './seat-legend'
import { useGetAsientos } from '../../hooks/use-get-asientos'
import type { Asiento, ConsultarAsientosRequest } from '../../models/sales.model'

interface SeatSelectionSearch {
  servicioId: string
  origenId: string
  destinoId: string
  empresaId: string
  empresa?: string
  origen?: string
  destino?: string
  fecha?: string
  hora?: string
}

export function SeatSelectionPage() {
  const [search, setSearch] = useState<SeatSelectionSearch | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<Asiento | null>(null)

  useEffect(() => {
    // Get search parameters from URL
    const urlParams = new URLSearchParams(window.location.search)
    const searchData: SeatSelectionSearch = {
      servicioId: urlParams.get('servicioId') || '',
      origenId: urlParams.get('origenId') || '',
      destinoId: urlParams.get('destinoId') || '',
      empresaId: urlParams.get('empresaId') || '',
      empresa: urlParams.get('empresa') || undefined,
      origen: urlParams.get('origen') || undefined,
      destino: urlParams.get('destino') || undefined,
      fecha: urlParams.get('fecha') || undefined,
      hora: urlParams.get('hora') || undefined,
    }
    setSearch(searchData)
  }, [])

  const consultarAsientosRequest: ConsultarAsientosRequest | null = search ? {
    servicioId: search.servicioId,
    origenId: search.origenId,
    destinoId: search.destinoId,
    empresaId: search.empresaId,
  } : null

  const { data: asientosData, isLoading, error } = useGetAsientos(consultarAsientosRequest)

  const handleSeatSelect = (asiento: Asiento) => {
    setSelectedSeat(asiento)
  }

  const handleConfirmSelection = () => {
    if (selectedSeat && search) {
      // Navigate to checkout or next step
      const checkoutParams = new URLSearchParams({
        ...search,
        asientoId: selectedSeat.numero,
        precio: selectedSeat.precio.toString(),
        tipo: selectedSeat.tipo,
        piso: selectedSeat.piso.toString(),
      })
      window.location.href = `/sales/checkout?${checkoutParams.toString()}`
    }
  }

  const handleGoBack = () => {
    window.location.href = '/sales'
  }

  if (!search || !search.servicioId) {
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            No se encontró información del servicio. Por favor, selecciona un servicio desde la página anterior.
          </AlertDescription>
        </Alert>
        <Button onClick={handleGoBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Servicios
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Selección de Asientos</h1>
            <p className="text-muted-foreground">
              {search.origen} → {search.destino} • {search.fecha} {search.hora}
            </p>
          </div>
        </div>
        {asientosData && (
          <Badge variant="secondary" className="text-sm">
            <Users className="h-4 w-4 mr-1" />
            {asientosData.totalDisponibles} disponibles
          </Badge>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando asientos disponibles...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-destructive mb-2">Error al cargar asientos</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Button onClick={handleGoBack} variant="outline" className="mt-4">
              Volver a Servicios
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Seat Selection */}
      {asientosData && !isLoading && !error && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Seat Grid */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Asientos Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SeatGrid 
                  asientos={asientosData.asientos} 
                  onSeatSelect={handleSeatSelect}
                  selectedSeat={selectedSeat}
                />
                <div className="mt-6">
                  <SeatLegend />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Service Info */}
            <ServiceInfo servicioInfo={asientosData.servicioInfo} />

            {/* Selected Seat Info */}
            {selectedSeat && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Asiento Seleccionado
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Asiento {selectedSeat.numero}</span>
                      <Badge variant="outline">Piso {selectedSeat.piso}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>{selectedSeat.tipo === 'VENTANA' ? 'Ventana' : selectedSeat.tipo}</p>
                      <p>{selectedSeat.calidad}</p>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Precio</span>
                      <span className="text-lg font-bold">
                        {new Intl.NumberFormat('es-PY', {
                          style: 'currency',
                          currency: 'PYG',
                          minimumFractionDigits: 0,
                        }).format(selectedSeat.precio)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Button */}
            <Button 
              onClick={handleConfirmSelection}
              disabled={!selectedSeat}
              className="w-full"
              size="lg"
            >
              {selectedSeat ? 'Continuar con Asiento ' + selectedSeat.numero : 'Selecciona un Asiento'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
