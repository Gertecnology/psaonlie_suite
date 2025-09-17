import { cn } from '@/lib/utils'
import type { Asiento } from '../../models/sales.model'

interface SeatGridProps {
  asientos: Asiento[]
  onSeatSelect: (asiento: Asiento) => void
  selectedSeat?: Asiento | null
}

const getSeatTypeColor = (tipo: string, disponible: boolean, isSelected: boolean = false) => {
  if (isSelected) {
    return 'bg-green-500 text-white border-green-600 shadow-lg'
  }
  
  if (!disponible) {
    return 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }
  
  switch (tipo) {
    case 'VENTANA':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300'
    case 'PASILLO':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-300'
    case 'CENTRO':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-300'
  }
}

const getSeatTypeLabel = (tipo: string) => {
  switch (tipo) {
    case 'VENTANA':
      return 'Ventana'
    case 'PASILLO':
      return 'Pasillo'
    case 'CENTRO':
      return 'Centro'
    default:
      return tipo
  }
}

function FloorGrid({ 
  floorSeats, 
  piso, 
  onSeatSelect, 
  selectedSeat 
}: { 
  floorSeats: Asiento[]
  piso: number
  onSeatSelect: (asiento: Asiento) => void
  selectedSeat?: Asiento | null
}) {
  // Group seats by row (assuming 4 columns)
  const rows: Asiento[][] = []
  for (let i = 0; i < floorSeats.length; i += 4) {
    rows.push(floorSeats.slice(i, i + 4))
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
              const isSelected = selectedSeat?.numero === asiento.numero
              return (
                <button
                  key={asiento.numero}
                  onClick={() => asiento.disponible && onSeatSelect(asiento)}
                  disabled={!asiento.disponible}
                  className={cn(
                    "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium",
                    "transition-all duration-200",
                    getSeatTypeColor(asiento.tipo, asiento.disponible, isSelected),
                    asiento.disponible && !isSelected && "cursor-pointer hover:scale-105 hover:shadow-md",
                    isSelected && "ring-2 ring-green-400 ring-offset-2"
                  )}
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

export function SeatGrid({ asientos, onSeatSelect, selectedSeat }: SeatGridProps) {
  // Separate seats by floor
  const piso1 = asientos.filter(asiento => asiento.piso === 1)
  const piso2 = asientos.filter(asiento => asiento.piso === 2)

  const hasTwoFloors = piso2.length > 0

  if (hasTwoFloors) {
    return (
      <div className="grid gap-8 lg:grid-cols-2">
        <FloorGrid 
          floorSeats={piso1} 
          piso={1} 
          onSeatSelect={onSeatSelect}
          selectedSeat={selectedSeat}
        />
        <FloorGrid 
          floorSeats={piso2} 
          piso={2} 
          onSeatSelect={onSeatSelect}
          selectedSeat={selectedSeat}
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
          selectedSeat={selectedSeat}
        />
      </div>
    </div>
  )
}
