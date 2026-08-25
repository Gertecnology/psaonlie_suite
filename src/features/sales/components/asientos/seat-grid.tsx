import { cn } from '@/lib/utils'
import type { Asiento, ConfiguracionBus } from '../../models/sales.model'
import { SEAT_STATE_CLASSES } from './seat-states'

interface SeatGridProps {
  asientos: Asiento[]
  onSeatSelect: (asiento: Asiento) => void
  selectedSeats?: Asiento[]
  blockedSeats?: Asiento[]
  configuracionBus: ConfiguracionBus
}

const getSeatTypeColor = (
  disponible: boolean,
  isSelected: boolean = false,
  isBlocked: boolean = false
) => {
  if (isBlocked) {
    return SEAT_STATE_CLASSES.bloqueado
  }

  if (isSelected) {
    return SEAT_STATE_CLASSES.seleccionado
  }

  if (!disponible) {
    return SEAT_STATE_CLASSES.ocupado
  }

  // Todos los asientos son de tipo ventana según los datos
  return SEAT_STATE_CLASSES.libre
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
  columnas,
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
    <div className='space-y-3'>
      <div className='text-center'>
        <h4 className='text-muted-foreground mb-2 text-sm font-semibold'>
          Piso {piso}
        </h4>
        <div className='bg-border h-px w-full'></div>
      </div>

      <div className='space-y-2'>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className='flex justify-center gap-2'>
            {row.map((asiento) => {
              const isSelected =
                selectedSeats?.some((seat) => seat.numero === asiento.numero) ||
                false
              const isBlocked =
                blockedSeats?.some((seat) => seat.numero === asiento.numero) ||
                false
              return (
                <button
                  key={asiento.numero}
                  onClick={() =>
                    asiento.disponible && !isBlocked && onSeatSelect(asiento)
                  }
                  disabled={!asiento.disponible || isBlocked}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-lg border-2 text-sm font-medium transition-all duration-200',
                    getSeatTypeColor(asiento.disponible, isSelected, isBlocked),
                    asiento.disponible &&
                      !isSelected &&
                      !isBlocked &&
                      'cursor-pointer hover:scale-105 hover:shadow-md'
                  )}
                  title={`Asiento ${asiento.numero} - ${getSeatTypeLabel(asiento.tipo)} - ${
                    isBlocked
                      ? 'Bloqueado'
                      : asiento.disponible
                        ? 'Disponible'
                        : 'Ocupado'
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

export function SeatGrid({
  asientos,
  onSeatSelect,
  selectedSeats,
  blockedSeats,
  configuracionBus,
}: SeatGridProps) {
  // Separate seats by floor
  const piso1 = asientos.filter((asiento) => asiento.piso === 1)
  const piso2 = asientos.filter((asiento) => asiento.piso === 2)

  const hasTwoFloors = configuracionBus.pisos > 1

  if (hasTwoFloors) {
    return (
      <div className='grid gap-8 lg:grid-cols-2'>
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
    <div className='flex justify-center'>
      <div className='max-w-md'>
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
