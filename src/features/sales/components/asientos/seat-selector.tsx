import { useState } from 'react'
import { Users, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Asiento, AsientosResponse, ServicioInfo } from '../models/sales.model'

interface SeatSelectorProps {
  asientosData: AsientosResponse | null
  isLoading: boolean
  error: Error | null
  onSeatSelect: (asiento: Asiento) => void
  onClose: () => void
  isOpen: boolean
}

const getSeatTypeColor = (tipo: string, disponible: boolean) => {
  if (!disponible) {
    return 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }
  
  switch (tipo) {
    case 'VENTANA':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300'
  }
}

const getSeatTypeLabel = (tipo: string) => {
  switch (tipo) {
    case 'VENTANA':
      return 'Ventana'
    default:
      return tipo
  }
}

function SeatGrid({ asientos, onSeatSelect }: { asientos: Asiento[], onSeatSelect: (asiento: Asiento) => void }) {
  // Separate seats by floor
  const piso1 = asientos.filter(asiento => asiento.piso === 1)
  const piso2 = asientos.filter(asiento => asiento.piso === 2)

  const renderFloor = (floorSeats: Asiento[], piso: number) => {
    // Group seats by row (assuming 4 columns)
    const rows: Asiento[][] = []
    for (let i = 0; i < floorSeats.length; i += 4) {
      rows.push(floorSeats.slice(i, i + 4))
    }

    return (
      <div className="space-y-3">
        <div className="text-center">
          <h4 className="text-sm font-semibold text-muted-foreground">
            Piso {piso}
          </h4>
        </div>
        <div className="space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2 justify-center">
              {row.map((asiento) => (
                <button
                  key={asiento.numero}
                  onClick={() => asiento.disponible && onSeatSelect(asiento)}
                  disabled={!asiento.disponible}
                  className={`
                    w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium
                    transition-all duration-200 ${getSeatTypeColor(asiento.tipo, asiento.disponible)}
                    ${asiento.disponible ? 'cursor-pointer hover:scale-105' : ''}
                  `}
                  title={`Asiento ${asiento.numero} - ${getSeatTypeLabel(asiento.tipo)} - ${asiento.disponible ? 'Disponible' : 'Ocupado'}`}
                >
                  {asiento.numero}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {piso1.length > 0 && renderFloor(piso1, 1)}
      {piso2.length > 0 && renderFloor(piso2, 2)}
    </div>
  )
}

function ServiceInfo({ servicioInfo }: { servicioInfo: ServicioInfo }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Información del Servicio</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Empresa</p>
          <p className="font-medium">{servicioInfo.empresa}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Parados</p>
          <p className="font-medium">{servicioInfo.parados} ({servicioInfo.paradosVendidos} vendidos)</p>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Tarifas</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{servicioInfo.calidadDescripcionA}</span>
            <Badge variant="outline">
              {new Intl.NumberFormat('es-PY', {
                style: 'currency',
                currency: 'PYG',
                minimumFractionDigits: 0,
              }).format(servicioInfo.tarifaA)}
            </Badge>
          </div>
          {servicioInfo.calidadDescripcionB && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{servicioInfo.calidadDescripcionB}</span>
              <Badge variant="outline">
                {new Intl.NumberFormat('es-PY', {
                  style: 'currency',
                  currency: 'PYG',
                  minimumFractionDigits: 0,
                }).format(servicioInfo.tarifaB)}
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SeatSelector({ 
  asientosData, 
  isLoading, 
  error, 
  onSeatSelect, 
  onClose, 
  isOpen 
}: SeatSelectorProps) {
  const [selectedSeat, setSelectedSeat] = useState<Asiento | null>(null)

  const handleSeatSelect = (asiento: Asiento) => {
    setSelectedSeat(asiento)
  }

  const handleConfirmSelection = () => {
    if (selectedSeat) {
      onSeatSelect(selectedSeat)
      setSelectedSeat(null)
    }
  }

  const handleClose = () => {
    setSelectedSeat(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seleccionar Asiento
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando asientos disponibles...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive mb-2">Error al cargar asientos</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        )}

        {asientosData && !isLoading && !error && (
          <div className="space-y-6">
            {/* Service Info */}
            <ServiceInfo servicioInfo={asientosData.servicioInfo} />

            <Separator />

            {/* Seat Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Asientos Disponibles</h3>
                <Badge variant="secondary">
                  {asientosData.totalDisponibles} disponibles
                </Badge>
              </div>

              <div className="flex justify-center">
                <SeatGrid 
                  asientos={asientosData.asientos} 
                  onSeatSelect={handleSeatSelect}
                />
              </div>

                             {/* Legend */}
               <div className="flex justify-center gap-4 text-sm">
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                   <span>Ventana</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                   <span>Disponible</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded"></div>
                   <span>Ocupado</span>
                 </div>
               </div>
            </div>

            {/* Selected Seat Info */}
            {selectedSeat && (
              <>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Asiento Seleccionado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">Asiento {selectedSeat.numero}</p>
                        <p className="text-sm text-muted-foreground">
                          {getSeatTypeLabel(selectedSeat.tipo)} • Piso {selectedSeat.piso}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedSeat.calidad}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          {new Intl.NumberFormat('es-PY', {
                            style: 'currency',
                            currency: 'PYG',
                            minimumFractionDigits: 0,
                          }).format(selectedSeat.precio)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={!selectedSeat}
              >
                Confirmar Selección
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
