import * as React from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { type PaginationState } from '@tanstack/react-table'
import { z } from 'zod'
import { useDebouncedValue } from '@/hooks/use-debounced-value'

/**
 * Table state that lives in the URL.
 *
 * Every list screen kept page, search and filters in local `useState`. Three
 * things followed from that, and users hit all three: pressing F5 lost the
 * context, a filtered list could not be shared as a link, and coming back from
 * a detail page dropped you on page 1 of an unfiltered list — which is exactly
 * the moment you want to be where you were.
 *
 * Putting it in the URL makes the browser do the work: back and forward move
 * between filter states, and the address bar is the shareable link.
 */

/** Query params every server-driven table understands. */
export const esquemaTablaUrl = z.object({
  pagina: z.coerce.number().int().min(1).optional(),
  tamano: z.coerce.number().int().min(1).max(100).optional(),
  buscar: z.string().optional(),
  orden: z.string().optional(),
  direccion: z.enum(['asc', 'desc']).optional(),
})

export type FiltrosTablaUrl = z.infer<typeof esquemaTablaUrl>

const TAMANO_POR_DEFECTO = 10

/**
 * Delay before a keystroke becomes a request.
 *
 * Long enough that typing "Santaniana" is one query and not ten; short enough
 * that it still feels like the list is answering you.
 */
const ESPERA_BUSQUEDA_MS = 300

export interface EstadoTablaServidor {
  /** For the table component. Zero-based, as TanStack expects. */
  pagination: PaginationState
  onPaginationChange: (
    actualizador:
      | PaginationState
      | ((previa: PaginationState) => PaginationState),
  ) => void

  /** What is in the box right now — the controlled input reads this. */
  busqueda: string
  /** What should be sent to the server: the debounced value. */
  busquedaAplicada: string
  setBusqueda: (valor: string) => void

  orden: string | undefined
  direccion: 'asc' | 'desc' | undefined
  setOrden: (campo: string | undefined, direccion?: 'asc' | 'desc') => void

  /** Page and size the API expects: page is 1-based here. */
  parametrosApi: { page: number; limit: number; search?: string }

  /** True when something narrows the list — drives the "Clear" button. */
  hayFiltros: boolean
  limpiarFiltros: () => void
}

/**
 * @param filtrosExtra Feature-specific filters already read from the URL. They
 * are only used to decide whether the "Clear" button shows and to reset the
 * page: this hook does not know what they mean.
 */
export function useTablaServidor(
  filtrosExtra: Record<string, unknown> = {},
): EstadoTablaServidor {
  const navigate = useNavigate()
  // `strict: false` porque el hook lo comparten rutas distintas y cada una
  // declara su propio esquema.
  const busquedaUrl = useSearch({ strict: false }) as FiltrosTablaUrl

  const pagina = busquedaUrl.pagina ?? 1
  const tamano = busquedaUrl.tamano ?? TAMANO_POR_DEFECTO
  const busquedaDeLaUrl = busquedaUrl.buscar ?? ''

  // Lo que se tipea se muestra al instante; lo que viaja al servidor espera.
  // Sin este estado local, cada tecla navegaría y el cursor saltaría.
  const [busqueda, setBusquedaLocal] = React.useState(busquedaDeLaUrl)
  const busquedaAplicada = useDebouncedValue(busqueda, ESPERA_BUSQUEDA_MS)

  // La URL puede cambiar sin pasar por el input: botón "atrás", un link
  // compartido, o "Limpiar". Ahí manda la URL.
  React.useEffect(() => {
    setBusquedaLocal(busquedaDeLaUrl)
  }, [busquedaDeLaUrl])

  const escribirUrl = React.useCallback(
    (cambios: Partial<FiltrosTablaUrl>, reemplazar = true) => {
      void navigate({
        // @ts-expect-error el hook es compartido: cada ruta tiene su esquema.
        search: (previa: Record<string, unknown>) => {
          const siguiente: Record<string, unknown> = { ...previa, ...cambios }
          // Un parámetro vacío en la barra de direcciones es ruido: se saca.
          for (const [clave, valor] of Object.entries(siguiente)) {
            if (valor === undefined || valor === '' || valor === null) {
              delete siguiente[clave]
            }
          }
          return siguiente
        },
        replace: reemplazar,
      })
    },
    [navigate],
  )

  // La búsqueda ya reposada se escribe en la URL y vuelve a la página 1: los
  // resultados son otros, y quedarse en la página 7 mostraría una lista vacía.
  React.useEffect(() => {
    if (busquedaAplicada === busquedaDeLaUrl) return
    escribirUrl({ buscar: busquedaAplicada || undefined, pagina: undefined })
  }, [busquedaAplicada, busquedaDeLaUrl, escribirUrl])

  const pagination = React.useMemo<PaginationState>(
    () => ({ pageIndex: pagina - 1, pageSize: tamano }),
    [pagina, tamano],
  )

  const onPaginationChange = React.useCallback(
    (
      actualizador:
        | PaginationState
        | ((previa: PaginationState) => PaginationState),
    ) => {
      const siguiente =
        typeof actualizador === 'function'
          ? actualizador(pagination)
          : actualizador

      escribirUrl(
        {
          pagina:
            siguiente.pageIndex === 0 ? undefined : siguiente.pageIndex + 1,
          tamano:
            siguiente.pageSize === TAMANO_POR_DEFECTO
              ? undefined
              : siguiente.pageSize,
        },
        // Cambiar de página SÍ es una entrada de historial: el botón "atrás"
        // tiene que volver a la página anterior, no salir de la lista. El
        // comentario decía esto pero la llamada omitía el argumento, así que
        // caía en el `replace = true` por defecto y hacía lo contrario.
        false,
      )
    },
    [pagination, escribirUrl],
  )

  const setOrden = React.useCallback(
    (campo: string | undefined, direccion: 'asc' | 'desc' = 'asc') => {
      escribirUrl({
        orden: campo,
        direccion: campo ? direccion : undefined,
        pagina: undefined,
      })
    },
    [escribirUrl],
  )

  const setBusqueda = React.useCallback((valor: string) => {
    setBusquedaLocal(valor)
  }, [])

  const hayFiltrosExtra = Object.values(filtrosExtra).some(
    (valor) => valor !== undefined && valor !== '' && valor !== null,
  )

  // Se mira la búsqueda que se está tipeando, no la aplicada: el botón
  // "Limpiar" tiene que aparecer apenas escribís, no 300 ms después.
  const hayFiltros = busqueda !== '' || busquedaUrl.orden !== undefined || hayFiltrosExtra

  const limpiarFiltros = React.useCallback(() => {
    setBusquedaLocal('')
    const vaciados = Object.fromEntries(
      Object.keys(filtrosExtra).map((clave) => [clave, undefined]),
    )
    escribirUrl({
      buscar: undefined,
      orden: undefined,
      direccion: undefined,
      pagina: undefined,
      ...vaciados,
    })
    // `filtrosExtra` es un objeto nuevo en cada render; sus claves no cambian.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escribirUrl, Object.keys(filtrosExtra).join(',')])

  return {
    pagination,
    onPaginationChange,
    busqueda,
    busquedaAplicada,
    setBusqueda,
    orden: busquedaUrl.orden,
    direccion: busquedaUrl.direccion,
    setOrden,
    parametrosApi: {
      page: pagina,
      limit: tamano,
      search: busquedaAplicada || undefined,
    },
    hayFiltros,
    limpiarFiltros,
  }
}
