import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet, useNavigate } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import GeneralError from '@/features/errors/general-error'
import NotFoundError from '@/features/errors/not-found-error'
import { useAuth } from '@/context/auth-context'
import { useEffect } from 'react'

function RootComponent() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      if (isAuthenticated) {
        navigate({ to: '/', replace: true })
      } else {
        navigate({ to: '/sign-in', replace: true })
      }
    }
  }, [isAuthenticated, navigate])
  return (
    <>
      <NavigationProgress />
      <Outlet />
      <Toaster duration={4000} />
    </>
  )
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
