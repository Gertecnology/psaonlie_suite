import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
      {process.env.NODE_ENV === 'development' && 
        // @ts-expect-error - Import is only used in development
        import('@tanstack/router-devtools').then(({ TanStackRouterDevtools }) => (
          <TanStackRouterDevtools />
        ))
      }
    </>
  )
} 