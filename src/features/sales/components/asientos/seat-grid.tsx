import { cn } from '@/lib/utils'
import type { Asiento, ConfiguracionBus } from '../../models/sales.model'

interface SeatGridProps {
  asientos: Asiento[]
  onSeatSelect: (asiento: Asiento) => void
  selectedSeats?: Asiento[]
  blockedSeats?: Asiento[]
  configuracionBus: ConfiguracionBus
}

const getSeatTypeColor = (disponible: boolean, isSelected: boolean = false, isBlocked: boolean = false) => {
  if (isBlocked) {
    return 'bg-blue-500 text-white border-blue-600 shadow-lg'
  }
  
  if (isSelected) {
    return 'bg-green-500 text-white border-green-600 shadow-lg'
  }
  
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

function FloorGrid({ 
  floorSeats, 
  piso, 
  onSeatSelect, 
  selectedSeats,
  blockedSeats,
  columnas
}: { 
  floorSeats: Asiento[]
  piso: number
  onSeatSelect: (asiento: Asiento) => void
  selectedSeats?: Asiento[]
  blockedSeats?: Asiento[]
  columnas: number
}) {
  // Group seats by row using the actual column configuration
  const rows: Asiento[][] = []
  for (let i = 0; i < floorSeats.length; i += columnas) {
    rows.push(floorSeats.slice(i, i + columnas))
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
          Piso {piso}
        </h4>
        <div className="w-full h-px bg-border"></div>
      </div>
      
      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2 justify-center">
            {row.map((asiento) => {
              const isSelected = selectedSeats?.some(seat => seat.numero === asiento.numero) || false
              const isBlocked = blockedSeats?.some(seat => seat.numero === asiento.numero) || false
              return (
                <button
                  key={asiento.numero}
                  onClick={() => asiento.disponible && !isBlocked && onSeatSelect(asiento)}
                  disabled={!asiento.disponible || isBlocked}
                  className={cn(
                    "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium",
                    "transition-all duration-200",
                    getSeatTypeColor(asiento.disponible, isSelected, isBlocked),
                    asiento.disponible && !isSelected && !isBlocked && "cursor-pointer hover:scale-105 hover:shadow-md",
                    isSelected && "ring-2 ring-green-400 ring-offset-2",
                    isBlocked && "ring-2 ring-blue-400 ring-offset-2"
                  )}
                  title={`Asiento ${asiento.numero} - ${getSeatTypeLabel(asiento.tipo)} - ${
                    isBlocked ? 'Bloqueado' : asiento.disponible ? 'Disponible' : 'Ocupado'
                  }`}
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

export function SeatGrid({ asientos, onSeatSelect, selectedSeats, blockedSeats, configuracionBus }: SeatGridProps) {
  // Separate seats by floor
  const piso1 = asientos.filter(asiento => asiento.piso === 1)
  const piso2 = asientos.filter(asiento => asiento.piso === 2)

  const hasTwoFloors = configuracionBus.pisos > 1

  if (hasTwoFloors) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <FloorGrid 
          floorSeats={piso1} 
          piso={1} 
          onSeatSelect={onSeatSelect}
          selectedSeats={selectedSeats}
          blockedSeats={blockedSeats}
          columnas={configuracionBus.columnas}
        />
        <FloorGrid 
          floorSeats={piso2} 
          piso={2} 
          onSeatSelect={onSeatSelect}
          selectedSeats={selectedSeats}
          blockedSeats={blockedSeats}
          columnas={configuracionBus.columnas}
        />
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div className="max-w-md">
        <FloorGrid 
          floorSeats={piso1} 
          piso={1} 
          onSeatSelect={onSeatSelect}
          selectedSeats={selectedSeats}
          blockedSeats={blockedSeats}
          columnas={configuracionBus.columnas}
        />
      </div>
    </div>
  )
}
