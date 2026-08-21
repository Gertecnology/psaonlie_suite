import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

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
 * Cuenta regresiva del bloqueo de asientos.
 *
 * El backend retiene los asientos 30 minutos. Pasado ese plazo la venta ya no
 * se puede confirmar con ese código, y hasta ahora el operador se enteraba
 * recién al fallar la confirmación, después de cargar todos los pasajeros.
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
  const porVencer = !expirado && restanteMs < 5 * 60 * 1000

  return (
    <Badge
      variant={expirado || porVencer ? 'destructive' : 'secondary'}
      className="text-xs"
    >
      <Clock className="h-3 w-3 mr-1" />
      {expirado
        ? 'Bloqueo vencido'
        : `Asientos reservados ${formatearRestante(restanteMs)}`}
    </Badge>
  )
}
