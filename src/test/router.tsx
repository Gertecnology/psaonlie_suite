import type { FunctionComponent } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { SidebarProvider } from '@/components/ui/sidebar'
import { esquemaFiltrosPanel } from '@/features/dashboard/models/busqueda.model'
import { crearQueryClient } from './utils'

/**
 * Monta una pantalla dentro de un router de memoria.
 *
 * Hace falta porque el panel y los informes leen sus filtros de la URL con
 * `useSearch` y los escriben con `useNavigate`: sin un router montado no
 * renderizan.
 *
 * Sirve además como prueba de humo del árbol completo. Como no se puede
 * levantar la app contra el backend (el `.env` apunta a producción), esto es lo
 * más cerca que se puede estar de abrir la pantalla de verdad: si un componente
 * revienta al montarse, revienta acá.
 */
export function renderEnRuta(
  Componente: FunctionComponent,
  { ruta = '/', busqueda = '' }: { ruta?: string; busqueda?: string } = {},
) {
  const rootRoute = createRootRoute()

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/',
    validateSearch: esquemaFiltrosPanel,
    component: Componente,
  })

  const reportsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/reports',
    validateSearch: esquemaFiltrosPanel,
    component: Componente,
  })

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, reportsRoute]),
    history: createMemoryHistory({ initialEntries: [`${ruta}${busqueda}`] }),
  })

  const client = crearQueryClient()

  return {
    router,
    client,
    ...render(
      <QueryClientProvider client={client}>
        {/* `PageLayout` monta el botón que pliega la barra lateral, y ese
            componente exige el proveedor. En la app lo pone el layout
            autenticado; acá se replica lo mínimo. */}
        <SidebarProvider>
          {/* El tipo del router de prueba no es el registrado globalmente. */}
          <RouterProvider router={router as never} />
        </SidebarProvider>
      </QueryClientProvider>,
    ),
  }
}
