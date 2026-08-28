import { useState } from 'react'

import {
  PRESET_POR_DEFECTO,
  aFechaISOLocal,
  deFechaISOLocal,
  periodoDesdePreset,
  type PresetPeriodo,
} from '@/lib/periodo'
import { SelectorRangoFechas } from './selector-rango-fechas'

interface FiltroDeRangoDeFechasProps {
  /** `YYYY-MM-DD`, o `undefined` si no se acotó. */
  desde?: string
  hasta?: string
  onCambiar: (rango: { desde?: string; hasta?: string }) => void
  className?: string
}

/**
 * El período, en un solo control.
 *
 * Por dentro es el mismo selector del panel de control: presets como filas
 * —«Últimos 30 días» se elige de un clic, sin pelearse con una grilla de
 * días— y el rango a medida detrás de una línea, para quien lo necesita.
 *
 * Hacia afuera habla en `YYYY-MM-DD`, que es lo que la API de la caja exige y
 * lo que rechaza si viene con zona horaria. La conversión vive acá y no en
 * cada pantalla: hecha con `Date` sueltas, un huso a la izquierda de UTC
 * devuelve el día anterior y el listado aparece corrido un día.
 */
export function FiltroDeRangoDeFechas({
  desde,
  hasta,
  onCambiar,
  className,
}: FiltroDeRangoDeFechasProps) {
  const [preset, setPreset] = useState<PresetPeriodo>(PRESET_POR_DEFECTO)

  const periodo = {
    desde: deFechaISOLocal(desde) ?? periodoDesdePreset(PRESET_POR_DEFECTO).desde,
    hasta: deFechaISOLocal(hasta) ?? periodoDesdePreset(PRESET_POR_DEFECTO).hasta,
  }

  return (
    <div className={className}>
      <SelectorRangoFechas
        preset={preset}
        periodo={periodo}
        onPreset={(nuevo) => {
          setPreset(nuevo)
          const elegido = periodoDesdePreset(nuevo)
          onCambiar({
            desde: aFechaISOLocal(elegido.desde),
            hasta: aFechaISOLocal(elegido.hasta),
          })
        }}
        onRango={(inicio, fin) => {
          setPreset('personalizado')
          onCambiar({
            desde: aFechaISOLocal(inicio),
            hasta: aFechaISOLocal(fin),
          })
        }}
      />
    </div>
  )
}
