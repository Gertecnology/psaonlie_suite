import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { METODOS_PAGO, ETIQUETAS_METODO_PAGO } from '@/lib/metodo-pago'
import {
  aFechaISOLocal,
  deFechaISOLocal,
  periodoDesdePreset,
  type Periodo,
  type PresetPeriodo,
} from '@/lib/periodo'
import { SelectorRangoFechas } from '@/features/dashboard/components/selector-rango-fechas'
import { useAgenciasPanel } from '@/features/dashboard/hooks/use-agencias-panel'
import type { FiltrosInforme } from '../models/informe.model'

/** Valor del select que significa «sin filtrar». */
const TODAS = 'all'

interface FiltrosInformeProps {
  borrador: FiltrosInforme
  onCambiar: <K extends keyof FiltrosInforme>(
    clave: K,
    valor: FiltrosInforme[K],
  ) => void
  /** Los que este informe acepta además del período y la empresa. */
  extras?: Array<'metodoPago' | 'agruparPor' | 'comparativo'>
}

/**
 * Los controles de la barra de arriba.
 *
 * Van fuera de la hoja: el informe emitido lleva los filtros **aplicados** en
 * su ficha técnica, no los controles.
 *
 * El período usa el mismo `SelectorRangoFechas` que el resto del panel, con
 * sus presets. Antes eran dos campos de fecha sueltos, y pedir «el mes pasado»
 * obligaba a abrir dos calendarios y no equivocarse con el último día del mes.
 * Un rango es un dato solo; partirlo en dos controles es partir la pregunta.
 */
export function FiltrosInformeControles({
  borrador,
  onCambiar,
  extras = [],
}: FiltrosInformeProps) {
  const { data: agencias } = useAgenciasPanel()

  // El preset vive acá y no en la URL: lo que define al informe es el rango,
  // no de qué botón salió. Un enlace compartido lleva las fechas.
  const [preset, setPreset] = React.useState<PresetPeriodo>('personalizado')

  const periodo = periodoDelBorrador(borrador)

  const aplicarPeriodo = (nuevo: Periodo) => {
    onCambiar('desde', aFechaISOLocal(nuevo.desde))
    onCambiar('hasta', aFechaISOLocal(nuevo.hasta))
  }

  return (
    <>
      <SelectorRangoFechas
        preset={preset}
        periodo={periodo}
        onPreset={(nuevo) => {
          setPreset(nuevo)
          aplicarPeriodo(periodoDesdePreset(nuevo))
        }}
        onRango={(desde, hasta) => {
          setPreset('personalizado')
          aplicarPeriodo({ desde, hasta })
        }}
      />

      <Select
        value={borrador.agenciaId ?? TODAS}
        onValueChange={(valor) =>
          onCambiar('agenciaId', valor === TODAS ? undefined : valor)
        }
      >
        <SelectTrigger className='w-[200px]' aria-label='Empresa'>
          <SelectValue placeholder='Todas las empresas' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>Todas las empresas</SelectItem>
          {(agencias ?? []).map((agencia) => (
            <SelectItem key={agencia.id} value={agencia.id}>
              {agencia.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {extras.includes('metodoPago') && (
        <Select
          value={borrador.metodoPago ?? TODAS}
          onValueChange={(valor) =>
            onCambiar(
              'metodoPago',
              valor === TODAS
                ? undefined
                : (valor as FiltrosInforme['metodoPago']),
            )
          }
        >
          <SelectTrigger className='w-[180px]' aria-label='Medio de cobro'>
            <SelectValue placeholder='Todos los medios' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todos los medios</SelectItem>
            {METODOS_PAGO.map((metodo) => (
              <SelectItem key={metodo} value={metodo}>
                {ETIQUETAS_METODO_PAGO[metodo]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {extras.includes('agruparPor') && (
        <Select
          value={borrador.agruparPor ?? 'dia'}
          onValueChange={(valor) =>
            onCambiar('agruparPor', valor as FiltrosInforme['agruparPor'])
          }
        >
          <SelectTrigger className='w-[150px]' aria-label='Agrupar por'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='dia'>Por día</SelectItem>
            <SelectItem value='semana'>Por semana</SelectItem>
            <SelectItem value='mes'>Por mes</SelectItem>
          </SelectContent>
        </Select>
      )}

      {extras.includes('comparativo') && (
        <SelectorRangoFechas
          preset='personalizado'
          periodo={periodoComparativo(borrador)}
          onPreset={(nuevo) => {
            const rango = periodoDesdePreset(nuevo)
            onCambiar('comparativoDesde', aFechaISOLocal(rango.desde))
            onCambiar('comparativoHasta', aFechaISOLocal(rango.hasta))
          }}
          onRango={(desde, hasta) => {
            onCambiar('comparativoDesde', aFechaISOLocal(desde))
            onCambiar('comparativoHasta', aFechaISOLocal(hasta))
          }}
        />
      )}
    </>
  )
}

/**
 * El período que el selector muestra.
 *
 * Sin fechas elegidas cae en el preset por defecto del panel, para que el
 * calendario abra donde el usuario espera en lugar de en 1970. Que se vea un
 * rango no significa que el informe esté emitido: eso lo decide `generado`.
 */
function periodoDelBorrador(borrador: FiltrosInforme): Periodo {
  const desde = deFechaISOLocal(borrador.desde)
  const hasta = deFechaISOLocal(borrador.hasta)
  if (desde && hasta) return { desde, hasta }
  return periodoDesdePreset('30d')
}

function periodoComparativo(borrador: FiltrosInforme): Periodo {
  const desde = deFechaISOLocal(borrador.comparativoDesde)
  const hasta = deFechaISOLocal(borrador.comparativoHasta)
  if (desde && hasta) return { desde, hasta }
  return periodoDesdePreset('mes-anterior')
}
