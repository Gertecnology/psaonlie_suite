import { useState } from 'react'
import { Users, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Asiento, AsientosResponse, ServicioInfo, ConfiguracionBus } from '../../models/sales.model'

interface SeatSelectorProps {
  asientosData: AsientosResponse | null
  isLoading: boolean
  error: Error | null
  onSeatSelect: (asientos: Asiento[]) => void
  onClose: () => void
  isOpen: boolean
  empresaNombre?: string
  serviceCharge?: string
}

const getSeatTypeColor = (disponible: boolean) => {
  if (!disponible) {
    return 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }
  
  // Todos los asientos son de tipo ventana según los datos
  return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300'
}

const getSeatTypeLabel = (_tipo: string) => {
  // Todos los asientos son de tipo ventana según los datos
  return 'Ventana'
}

function SeatGrid({ asientos, onSeatSelect, selectedSeats, configuracionBus }: { 
  asientos: Asiento[], 
  onSeatSelect: (asiento: Asiento) => void,
  selectedSeats: Asiento[],
  configuracionBus: ConfiguracionBus
}) {
  // Separate seats by floor
  const piso1 = asientos.filter(asiento => asiento.piso === 1)
  const piso2 = asientos.filter(asiento => asiento.piso === 2)

  const renderFloor = (floorSeats: Asiento[], piso: number) => {
    // Group seats by row using the actual column configuration
    const rows: Asiento[][] = []
    for (let i = 0; i < floorSeats.length; i += configuracionBus.columnas) {
      rows.push(floorSeats.slice(i, i + configuracionBus.columnas))
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
              {row.map((asiento) => {
                const isSelected = selectedSeats.some(seat => seat.numero === asiento.numero)
                return (
                  <button
                    key={asiento.numero}
                    onClick={() => asiento.disponible && onSeatSelect(asiento)}
                    disabled={!asiento.disponible}
                    className={`
                      w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium
                      transition-all duration-200 ${getSeatTypeColor(asiento.disponible)}
                      ${isSelected ? 'bg-green-500 text-white border-green-600 shadow-lg ring-2 ring-green-400 ring-offset-2' : ''}
                      ${asiento.disponible && !isSelected ? 'cursor-pointer hover:scale-105' : ''}
                    `}
                    title={`Asiento ${asiento.numero} - ${getSeatTypeLabel(asiento.tipo)} - ${asiento.disponible ? 'Disponible' : 'Ocupado'}`}
                  >
                    {asiento.numero}
                  </button>
                )
              })}
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

function ServiceInfo({ servicioInfo, empresaNombre, serviceCharge }: { servicioInfo: ServicioInfo, empresaNombre?: string, serviceCharge?: string }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Información del Servicio</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Empresa</p>
          <p className="font-medium">{empresaNombre || servicioInfo.empresa}</p>
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
        
        {serviceCharge && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Cargo por Servicio</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cargo por Servicio</span>
                <Badge variant="secondary">
                  {serviceCharge}%
                </Badge>
              </div>
            </div>
          </>
        )}
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
  isOpen,
  empresaNombre,
  serviceCharge
}: SeatSelectorProps) {
  const [selectedSeats, setSelectedSeats] = useState<Asiento[]>([])

  const handleSeatSelect = (asiento: Asiento) => {
    setSelectedSeats(prev => {
      // Si el asiento ya está seleccionado, lo removemos
      if (prev.some(seat => seat.numero === asiento.numero)) {
        return prev.filter(seat => seat.numero !== asiento.numero)
      }
      
      // Si ya tenemos 2 asientos seleccionados, no permitimos más
      if (prev.length >= 2) {
        return prev
      }
      
      // Agregamos el nuevo asiento
      return [...prev, asiento]
    })
  }

  const handleConfirmSelection = () => {
    if (selectedSeats.length > 0) {
      onSeatSelect(selectedSeats)
      setSelectedSeats([])
    }
  }

  const handleClose = () => {
    setSelectedSeats([])
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
            <ServiceInfo servicioInfo={asientosData.servicioInfo} empresaNombre={empresaNombre} serviceCharge={serviceCharge} />

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
                  selectedSeats={selectedSeats}
                  configuracionBus={asientosData.configuracionBus}
                />
              </div>

              {/* Legend */}
              <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 border border-green-600 rounded"></div>
                  <span>Seleccionado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded"></div>
                  <span>Ocupado</span>
                </div>
              </div>
            </div>

            {/* Selected Seats Info */}
            {selectedSeats.length > 0 && (
              <>
                <Separator />
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Asientos Seleccionados ({selectedSeats.length}/2)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedSeats.map((seat) => (
                        <div key={seat.numero} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-base text-gray-900">Asiento {seat.numero}</span>
                              <Badge variant="outline" className="text-xs bg-white text-gray-700 border-gray-300">Piso {seat.piso}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{seat.calidad}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-900">
                              {new Intl.NumberFormat('es-PY', {
                                style: 'currency',
                                currency: 'PYG',
                                minimumFractionDigits: 0,
                              }).format(seat.precio)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Subtotal</span>
                          <span className="text-sm font-medium">
                            {new Intl.NumberFormat('es-PY', {
                              style: 'currency',
                              currency: 'PYG',
                              minimumFractionDigits: 0,
                            }).format(selectedSeats.reduce((total, seat) => total + seat.precio, 0))}
                          </span>
                        </div>
                        {serviceCharge && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Cargo por servicio ({serviceCharge}%)</span>
                            <span className="text-sm font-medium">
                              {new Intl.NumberFormat('es-PY', {
                                style: 'currency',
                                currency: 'PYG',
                                minimumFractionDigits: 0,
                              }).format(
                                Math.round(
                                  selectedSeats.reduce((total, seat) => total + seat.precio, 0) * 
                                  (parseFloat(serviceCharge) / 100)
                                )
                              )}
                            </span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total</span>
                          <span className="text-lg font-bold">
                            {new Intl.NumberFormat('es-PY', {
                              style: 'currency',
                              currency: 'PYG',
                              minimumFractionDigits: 0,
                            }).format(
                              selectedSeats.reduce((total, seat) => total + seat.precio, 0) +
                              (serviceCharge ? 
                                Math.round(
                                  selectedSeats.reduce((total, seat) => total + seat.precio, 0) * 
                                  (parseFloat(serviceCharge) / 100)
                                ) : 0
                              )
                            )}
                          </span>
                        </div>
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
                disabled={selectedSeats.length === 0}
              >
                Confirmar Selección ({selectedSeats.length})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
