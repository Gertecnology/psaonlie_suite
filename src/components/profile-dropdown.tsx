import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useNavigate } from '@tanstack/react-router'
import { logout } from '@/services/auth'

export function ProfileDropdown() {
  const user = useCurrentUser()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try {
      if (refreshToken) {
        await logout(refreshToken)
      }
    } catch (_e) {
      // Puedes mostrar un toast si quieres
    } finally {
      localStorage.clear()
      navigate({ to: '/sign-in', replace: true })
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user?.urlPerfil || ''} alt={`${user?.firstName} ${user?.lastName}`} />
            <AvatarFallback>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>{user?.firstName} {user?.lastName}</p>
            <p className='text-muted-foreground text-xs leading-none'>
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          Cerrar sesión
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
