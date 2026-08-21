import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'

/**
 * Utilidades compartidas por los tests.
 *
 * El `QueryClient` se crea uno por test: compartirlo haría que la caché de un
 * caso contaminara al siguiente y los tests pasarían o fallarían según el orden
 * en que corran.
 */

export function crearQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Sin reintentos: un test que espera un error no tiene por qué esperar
        // tres intentos con backoff.
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: { retry: false },
    },
  })
}

export function ProveedorDeConsultas({
  children,
  client = crearQueryClient(),
}: {
  children: ReactNode
  client?: QueryClient
}) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** `render` de testing-library con el proveedor de React Query ya montado. */
export function renderConProveedores(
  ui: ReactNode,
  opciones: Omit<RenderOptions, 'wrapper'> = {},
) {
  const client = crearQueryClient()
  return {
    client,
    ...render(ui, {
      wrapper: ({ children }) => (
        <ProveedorDeConsultas client={client}>{children}</ProveedorDeConsultas>
      ),
      ...opciones,
    }),
  }
}

/**
 * `Intl` separa el símbolo de moneda del número con un espacio duro (U+00A0)
 * para que "Gs." no quede colgado al final de una línea. Testing Library no lo
 * trata como un espacio común, así que buscar "Gs. 840.000" con un espacio
 * normal no encuentra nada — y el mensaje de error muestra dos strings que se
 * ven idénticos. Estos ayudantes eliminan esa trampa.
 */
const sinEspacioDuro = (texto: string) => texto.replace(/\u00A0/g, ' ')

/** Matcher exacto que ignora la diferencia entre espacio duro y común. */
export function textoDinero(esperado: string) {
  return (contenido: string) =>
    sinEspacioDuro(contenido) === sinEspacioDuro(esperado)
}

/** Matcher parcial, para cuando el importe va acompañado de otro texto. */
export function contieneDinero(esperado: string) {
  return (contenido: string) =>
    sinEspacioDuro(contenido).includes(sinEspacioDuro(esperado))
}

/** Respuesta JSON exitosa, para los mocks de `fetch`. */
export function respuestaJson(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
