import * as React from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { FiltrosInforme } from '../models/informe.model'

/**
 * Report filters, split into what you are choosing and what has been applied.
 *
 * The panel's existing filter hook navigates on every control's change event,
 * which is why "not filtered yet" could not exist there: the moment you touched
 * anything, the query ran. Reports need the opposite — you set several filters,
 * then ask for them all at once.
 *
 * So the draft lives in local state and only reaches the URL when Generar is
 * pressed. That single write is also what makes the report shareable: the link
 * carries the filters AND `generado`, so opening it produces the same report
 * rather than an empty screen.
 */
export function useFiltrosInforme() {
  const navigate = useNavigate()
  const aplicados = useSearch({ strict: false }) as FiltrosInforme

  const [borrador, setBorrador] = React.useState<FiltrosInforme>(aplicados)

  // La URL puede cambiar sin pasar por los controles: botón "atrás" o un link
  // compartido. Ahí manda la URL.
  React.useEffect(() => {
    setBorrador(aplicados)
  }, [aplicados])

  const cambiar = React.useCallback(
    <K extends keyof FiltrosInforme>(clave: K, valor: FiltrosInforme[K]) => {
      setBorrador((previo) => ({ ...previo, [clave]: valor }))
    },
    [],
  )

  const generar = React.useCallback(() => {
    void navigate({
      // @ts-expect-error cada informe declara su propio esquema de búsqueda.
      search: () => {
        const siguiente: Record<string, unknown> = {
          ...borrador,
          generado: true,
          // Un informe nuevo empieza por la primera página.
          pagina: undefined,
        }
        for (const [clave, valor] of Object.entries(siguiente)) {
          if (valor === undefined || valor === '' || valor === null) {
            delete siguiente[clave]
          }
        }
        return siguiente
      },
      // Generar SÍ es una entrada de historial: el botón "atrás" tiene que
      // devolver al informe anterior.
      replace: false,
    })
  }, [borrador, navigate])

  /** A period is the minimum any of these reports needs. */
  const puedeGenerar = Boolean(borrador.desde && borrador.hasta)

  return { borrador, aplicados, cambiar, generar, puedeGenerar }
}
