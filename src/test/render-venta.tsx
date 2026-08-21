import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { RoundTripProvider } from '@/features/sales/context/round-trip-context'
import type {
  RoundTripSearchData,
  RoundTripStep,
} from '@/features/sales/models/sales.model'

/**
 * Renderiza un paso del flujo de venta con el contexto ya poblado.
 *
 * `retry: false` para que un fallo de red en un test no se reintente y
 * cambie la cantidad de llamadas que el test verifica.
 */
export function renderVenta(
  ui: ReactNode,
  opciones: {
    datosIniciales?: RoundTripSearchData
    pasoInicial?: RoundTripStep
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  const resultado = render(
    <QueryClientProvider client={queryClient}>
      <RoundTripProvider
        datosIniciales={opciones.datosIniciales}
        pasoInicial={opciones.pasoInicial}
      >
        {ui}
      </RoundTripProvider>
    </QueryClientProvider>,
  )

  return { ...resultado, queryClient }
}
