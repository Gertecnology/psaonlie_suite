import { cn } from '@/lib/utils'
import type { Asiento, ConfiguracionBus } from '../../models/sales.model'
import {
  bordeDeLaCalidad,
  leerCalidades,
  type CalidadDelServicio,
} from '../../utils/las-calidades-del-servicio'
import { formatearGuaranies } from '../../utils/money'
import {
  armarPlanoDelPiso,
  hayPosiciones,
  type Celda,
} from '../../utils/plano-del-colectivo'

interface SeatGridProps {
  asientos: Asiento[]
  onSeatSelect: (asiento: Asiento, conShift?: boolean) => void
  selectedSeats?: Asiento[]
  blockedSeats?: Asiento[]
  configuracionBus: ConfiguracionBus
}

/**
 * El rayado de una butaca ocupada.
 *
 * Ocupada y libre se distinguían sólo por el relleno, y en una notebook con
 * el brillo bajo los dos grises se ven iguales. El rayado se lee aunque la
 * pantalla mienta con el color.
 */
const RAYADO_DE_OCUPADA = {
  backgroundImage:
    'repeating-linear-gradient(135deg, var(--muted) 0 4px, transparent 4px 8px)',
} as const

function Butaca({
  asiento,
  elegida,
  reservada,
  calidades,
  onSeatSelect,
}: {
  asiento: Asiento
  elegida: boolean
  reservada: boolean
  calidades: CalidadDelServicio[]
  onSeatSelect: (asiento: Asiento, conShift?: boolean) => void
}) {
  const estado = reservada
    ? 'Reservada para vos'
    : elegida
      ? 'Elegida'
      : asiento.disponible
        ? 'Libre'
        : 'Ocupada'

  const mia = elegida || reservada

  return (
    <button
      onClick={(evento) =>
        asiento.disponible && !reservada && onSeatSelect(asiento, evento.shiftKey)
      }
      disabled={!asiento.disponible || reservada}
      style={!asiento.disponible && !mia ? RAYADO_DE_OCUPADA : undefined}
      className={cn(
        'flex h-[30px] w-[30px] items-center justify-center rounded-[5px] text-[11.5px] font-semibold tabular-nums transition-colors',
        bordeDeLaCalidad(asiento.calidad, calidades),
        mia
          ? 'border-primary bg-primary text-primary-foreground'
          : asiento.disponible
            ? 'border-input bg-card text-foreground hover:bg-accent cursor-pointer'
            : 'border-border text-muted-foreground cursor-not-allowed border-dashed',
        // La reservada ya está retenida con la empresa: se ve como propia pero
        // no se puede soltar de un click, para no perder el bloqueo por error.
        reservada && 'cursor-default'
      )}
      title={`Butaca ${asiento.numero} · ${estado} · ${formatearGuaranies(asiento.precio)}`}
      aria-label={`Butaca ${asiento.numero}, ${estado}`}
      aria-pressed={mia}
    >
      {asiento.numero}
    </button>
  )
}

/** Un piso, dibujado como la carrocería que es: frente abajo, pasillo al medio. */
function Piso({
  floorSeats,
  piso,
  onSeatSelect,
  selectedSeats,
  blockedSeats,
  configuracionBus,
  calidades,
}: {
  floorSeats: Asiento[]
  piso: number
  onSeatSelect: (asiento: Asiento, conShift?: boolean) => void
  selectedSeats?: Asiento[]
  blockedSeats?: Asiento[]
  configuracionBus: ConfiguracionBus
  calidades: CalidadDelServicio[]
}) {
  const conPosicion = hayPosiciones(floorSeats)

  // Con posición, cada butaca va donde la transportista dice que va. Sin ella
  // —una empresa que no informa la fila— se cae a filas del ancho declarado,
  // que es lo que hacía antes: no es un plano, pero al menos no miente sobre
  // dónde está cada una.
  const filas = conPosicion
    ? armarPlanoDelPiso(floorSeats, piso, configuracionBus).filas
    : porTandas(floorSeats, configuracionBus.columnas || 4)

  const mias = floorSeats.filter(
    (asiento) =>
      selectedSeats?.some((elegida) => elegida.numero === asiento.numero) ||
      blockedSeats?.some((reservada) => reservada.numero === asiento.numero)
  ).length

  return (
    <div className='border-border flex-none rounded-t-xl rounded-b-[5px] border-[1.5px] p-2.5'>
      <p className='text-muted-foreground mb-2 text-center text-[10px] font-bold tracking-[0.1em] uppercase'>
        Piso {piso}
        {mias > 0 && ` · ${mias} ${mias === 1 ? 'elegida' : 'elegidas'}`}
      </p>

      <div className='flex flex-col gap-[5px]'>
        {filas.map((fila, indiceDeFila) => (
          <div key={indiceDeFila} className='flex items-center gap-[5px]'>
            {fila.map((celda, indiceDeCelda) => {
              if (celda.tipo === 'pasillo') {
                // El pasillo es el hueco, no un ícono: con la línea a los
                // costados el ojo lee dos bloques de butacas en vez de una
                // grilla, que es lo que se ve al subir a un colectivo.
                return (
                  <div
                    key={`pasillo-${indiceDeCelda}`}
                    className='border-border mx-[5px] h-[30px] w-5 border-r border-l border-dashed'
                    aria-hidden='true'
                  />
                )
              }

              if (celda.tipo === 'hueco') {
                return (
                  <div
                    key={`hueco-${indiceDeCelda}`}
                    className='h-[30px] w-[30px]'
                    aria-hidden='true'
                  />
                )
              }

              const asiento = celda.asiento

              return (
                <Butaca
                  key={asiento.numero}
                  asiento={asiento}
                  elegida={
                    selectedSeats?.some(
                      (seat) => seat.numero === asiento.numero
                    ) || false
                  }
                  reservada={
                    blockedSeats?.some(
                      (seat) => seat.numero === asiento.numero
                    ) || false
                  }
                  calidades={calidades}
                  onSeatSelect={onSeatSelect}
                />
              )
            })}
          </div>
        ))}
      </div>

      <p className='text-muted-foreground border-border mt-2 border-t border-dashed pt-1.5 text-center text-[9.5px]'>
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
  const calidades = leerCalidades(asientos)

  // Los pisos van uno al lado del otro y cada uno ocupa lo que necesita. Con
  // una grilla de mitades el piso 2, que suele tener tres filas, quedaba
  // estirado al ancho del de abajo y dejaba de parecer un colectivo.
  const pisos = [...new Set(asientos.map((asiento) => asiento.piso ?? 1))].sort(
    (a, b) => a - b
  )

  return (
    <div className='flex flex-wrap items-start gap-6'>
      {pisos.map((piso) => (
        <Piso
          key={piso}
          floorSeats={asientos.filter((asiento) => (asiento.piso ?? 1) === piso)}
          piso={piso}
          onSeatSelect={onSeatSelect}
          selectedSeats={selectedSeats}
          blockedSeats={blockedSeats}
          configuracionBus={configuracionBus}
          calidades={calidades}
        />
      ))}
    </div>
  )
}
