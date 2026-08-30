import { useRoundTrip } from '../context/round-trip-context'

/**
 * En qué paso de la venta está el vendedor.
 *
 * Una venta de mostrador son seis pantallas y el flujo no tiene dirección
 * propia: la URL dice `/sales` todo el tiempo. Sin este indicador no hay forma
 * de saber cuánto falta ni cuántas pantallas hay.
 */

const PASOS = 6

/** Qué número le toca a cada paso del flujo. */
const NUMERO_DEL_PASO: Record<string, number> = {
  search: 1,
  'servicios-vuelta': 2,
  'ida-seats': 3,
  'vuelta-seats': 3,
  checkout: 4,
  payment: 5,
}

export function PasoDeLaVenta({ hayResultados }: { hayResultados?: boolean }) {
  const { currentStep } = useRoundTrip()

  // Buscar y elegir el servicio son la misma pantalla, pero para quien vende
  // son dos momentos: mientras no hay resultados está buscando.
  const numero =
    currentStep === 'search' && hayResultados
      ? 2
      : (NUMERO_DEL_PASO[currentStep] ?? 1)

  return (
    <div className='text-muted-foreground flex items-center gap-2 text-sm'>
      <span>Paso</span>
      <span className='bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums'>
        {numero}
      </span>
      <span className='opacity-60'>de {PASOS}</span>
    </div>
  )
}
