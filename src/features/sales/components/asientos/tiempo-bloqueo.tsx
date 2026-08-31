import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TiempoBloqueoProps {
  /** Fecha ISO de expiración que devuelve el bloqueo. */
  expiraEn?: string | null
  onExpirado?: () => void
}

function formatearRestante(milisegundos: number): string {
  const totalSegundos = Math.max(0, Math.floor(milisegundos / 1000))
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  return `${minutos}:${segundos.toString().padStart(2, '0')}`
}

/**
 * Cuánto queda de la reserva.
 *
 * La transportista retiene las butacas unos minutos y el backend renueva el
 * bloqueo antes de que se venza, mientras el vendedor sigue trabajando. El
 * reloj se repone solo cuando eso pasa.
 *
 * Por eso el pill es neutro y aclara que se renueva sola: un contador en rojo
 * bajando hace que quien vende apure la carga de los pasajeros, y con
 * dieciocho apurarse es equivocarse. Sólo se pone en rojo cuando de verdad
 * venció, que es cuando hay algo que hacer.
 */
export function TiempoBloqueo({ expiraEn, onExpirado }: TiempoBloqueoProps) {
  const [restanteMs, setRestanteMs] = useState<number | null>(null)

  useEffect(() => {
    if (!expiraEn) {
      setRestanteMs(null)
      return
    }

    const vencimiento = new Date(expiraEn).getTime()
    if (Number.isNaN(vencimiento)) {
      setRestanteMs(null)
      return
    }

    let yaAvisado = false

    const actualizar = () => {
      const restante = vencimiento - Date.now()
      setRestanteMs(restante)

      if (restante <= 0 && !yaAvisado) {
        yaAvisado = true
        onExpirado?.()
      }
    }

    actualizar()
    const intervalo = setInterval(actualizar, 1000)
    return () => clearInterval(intervalo)
  }, [expiraEn, onExpirado])

  if (restanteMs === null) return null

  const expirado = restanteMs <= 0

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-full border py-1 pr-3 pl-2.5',
        expirado
          ? 'border-estado-critico/40 bg-estado-critico/10'
          : 'border-border bg-muted'
      )}
    >
      <Clock
        className={cn(
          'h-3.5 w-3.5 flex-none',
          expirado ? 'text-estado-critico' : 'text-muted-foreground'
        )}
        aria-hidden='true'
      />
      {expirado ? (
        <span className='text-estado-critico text-[13px] font-semibold'>
          La reserva venció
        </span>
      ) : (
        <>
          <span className='text-sm font-bold tabular-nums'>
            {formatearRestante(restanteMs)}
          </span>
          <span className='text-muted-foreground text-[11px]'>
            se renueva sola
          </span>
        </>
      )}
    </div>
  )
}
