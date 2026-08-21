import { useCallback, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import {
  PRESET_POR_DEFECTO,
  aFechaISOLocal,
  deFechaISOLocal,
  finDelDia,
  inicioDelDia,
  periodoAnterior,
  periodoDesdePreset,
  type Periodo,
  type PresetPeriodo,
} from '@/lib/periodo'
import type { FiltrosUrl } from '../models/busqueda.model'

export interface EstadoFiltrosPanel {
  preset: PresetPeriodo
  periodo: Periodo
  /** Mismo largo que `periodo`, inmediatamente anterior. Para comparar. */
  anterior: Periodo
  empresaId?: string
  informe?: string
  aplicarPreset: (preset: PresetPeriodo) => void
  aplicarRango: (desde: Date, hasta: Date) => void
  aplicarEmpresa: (empresaId: string | undefined) => void
  aplicarInforme: (informe: string) => void
}

/**
 * Fuente única de verdad de los filtros del panel.
 *
 * Un solo período gobierna todas las tarjetas, gráficos y tablas de la vista.
 * Si cada gráfico tuviera su propio filtro, dos números de la misma pantalla
 * podrían contradecirse y nadie sabría cuál creer.
 *
 * Se lee con `strict: false` porque el mismo hook lo usan el panel principal y
 * la sección de informes, que son rutas distintas con el mismo esquema.
 */
export function useFiltrosPanel(): EstadoFiltrosPanel {
  const busqueda = useSearch({ strict: false }) as FiltrosUrl
  const navigate = useNavigate()

  const actualizar = useCallback(
    (cambios: Partial<FiltrosUrl>) => {
      const reducer = (previo: FiltrosUrl): FiltrosUrl => ({
        ...previo,
        ...cambios,
      })

      void navigate({
        // Sin `to`, `navigate` conserva la ruta actual — que es justo lo que
        // hace falta, porque este hook lo usan dos rutas distintas. El router
        // no puede inferir el tipo de `search` sin saber cuál, de ahí el cast;
        // el esquema real lo valida `validateSearch` en cada ruta.
        search: reducer as never,
        replace: true,
      })
    },
    [navigate]
  )

  const preset = busqueda.preset ?? PRESET_POR_DEFECTO

  const periodo = useMemo<Periodo>(() => {
    if (preset === 'personalizado') {
      const desde = deFechaISOLocal(busqueda.desde)
      const hasta = deFechaISOLocal(busqueda.hasta)
      if (desde && hasta) {
        // Un rango invertido es un error de tipeo en la URL, no un rango vacío.
        const [a, b] = desde <= hasta ? [desde, hasta] : [hasta, desde]
        return { desde: inicioDelDia(a), hasta: finDelDia(b) }
      }
    }
    return periodoDesdePreset(preset)
  }, [preset, busqueda.desde, busqueda.hasta])

  const anterior = useMemo(() => periodoAnterior(periodo), [periodo])

  const aplicarPreset = useCallback(
    (nuevo: PresetPeriodo) => {
      if (nuevo === 'personalizado') {
        const actual = periodoDesdePreset(preset)
        actualizar({
          preset: 'personalizado',
          desde: aFechaISOLocal(actual.desde),
          hasta: aFechaISOLocal(actual.hasta),
        })
        return
      }
      actualizar({ preset: nuevo, desde: undefined, hasta: undefined })
    },
    [actualizar, preset]
  )

  const aplicarRango = useCallback(
    (desde: Date, hasta: Date) => {
      actualizar({
        preset: 'personalizado',
        desde: aFechaISOLocal(desde),
        hasta: aFechaISOLocal(hasta),
      })
    },
    [actualizar]
  )

  const aplicarEmpresa = useCallback(
    (empresaId: string | undefined) => {
      actualizar({ empresaId: empresaId || undefined })
    },
    [actualizar]
  )

  const aplicarInforme = useCallback(
    (informe: string) => actualizar({ informe }),
    [actualizar]
  )

  return {
    preset,
    periodo,
    anterior,
    empresaId: busqueda.empresaId || undefined,
    informe: busqueda.informe,
    aplicarPreset,
    aplicarRango,
    aplicarEmpresa,
    aplicarInforme,
  }
}
