import { cn } from '@/lib/utils'
import type { Asiento, ConfiguracionBus } from '../../models/sales.model'
import { formatearGuaranies } from '../../utils/money'
import {
  armarPlanoDelPiso,
  hayPosiciones,
  type Celda,
} from '../../utils/plano-del-colectivo'
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


function FloorGrid({
  floorSeats,
  piso,
  onSeatSelect,
  selectedSeats,
  blockedSeats,
  configuracionBus,
}: {
  floorSeats: Asiento[]
  piso: number
  onSeatSelect: (asiento: Asiento) => void
  selectedSeats?: Asiento[]
  blockedSeats?: Asiento[]
  configuracionBus: ConfiguracionBus
}) {
  const conPosicion = hayPosiciones(floorSeats)

  // Con posición, cada butaca va donde la transportista dice que va. Sin ella
  // —una empresa que no informa la fila— se cae a filas del ancho declarado,
  // que es lo que hacía antes: no es un plano, pero al menos no miente sobre
  // dónde está cada una.
  const filas = conPosicion
    ? armarPlanoDelPiso(floorSeats, piso, configuracionBus).filas
    : porTandas(floorSeats, configuracionBus.columnas || 4)

  return (
    <div className='space-y-3'>
      <div className='text-center'>
        <h4 className='text-muted-foreground mb-2 text-sm font-semibold'>
          Piso {piso}
        </h4>
        <div className='bg-border h-px w-full'></div>
      </div>

      <div className='space-y-2'>
        {filas.map((fila, indiceDeFila) => (
          <div key={indiceDeFila} className='flex justify-center gap-2'>
            {fila.map((celda, indiceDeCelda) => {
              if (celda.tipo === 'pasillo') {
                // El pasillo es el hueco, no un ícono: con la línea a los
                // costados el ojo lee dos bloques de butacas en vez de una
                // grilla, que es lo que se ve al subir a un colectivo.
                return (
                  <div
                    key={`pasillo-${indiceDeCelda}`}
                    className='border-border mx-1 h-12 w-4 border-r border-l border-dashed'
                    aria-hidden='true'
                  />
                )
              }

              if (celda.tipo === 'hueco') {
                return (
                  <div
                    key={`hueco-${indiceDeCelda}`}
                    className='h-12 w-12'
                    aria-hidden='true'
                  />
                )
              }

              const asiento = celda.asiento
              const isSelected =
                selectedSeats?.some((seat) => seat.numero === asiento.numero) ||
                false
              const isBlocked =
                blockedSeats?.some((seat) => seat.numero === asiento.numero) ||
                false

              const estado = isBlocked
                ? 'Reservada para vos'
                : asiento.disponible
                  ? 'Libre'
                  : 'Ocupada'

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
                  title={`Butaca ${asiento.numero} · ${estado} · ${formatearGuaranies(asiento.precio)}`}
                  aria-label={`Butaca ${asiento.numero}, ${estado}`}
                >
                  {asiento.numero}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <p className='text-muted-foreground text-center text-[11px]'>
        ▲ frente
      </p>
    </div>
  )
}

/** El reparto viejo, para cuando la empresa no informa dónde va cada butaca. */
function porTandas(asientos: Asiento[], ancho: number): Celda[][] {
  const filas: Celda[][] = []
  for (let i = 0; i < asientos.length; i += ancho) {
    filas.push(
      asientos
        .slice(i, i + ancho)
        .map((asiento) => ({ tipo: 'butaca', asiento }) as Celda)
    )
  }
  return filas
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
          configuracionBus={configuracionBus}
        />
        <FloorGrid
          floorSeats={piso2}
          piso={2}
          onSeatSelect={onSeatSelect}
          selectedSeats={selectedSeats}
          blockedSeats={blockedSeats}
          configuracionBus={configuracionBus}
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
          configuracionBus={configuracionBus}
        />
      </div>
    </div>
  )
}
