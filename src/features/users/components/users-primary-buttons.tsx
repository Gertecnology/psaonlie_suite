import { IconUserPlus } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function UsersPrimaryButtons() {
  return (
    // Un enlace y no un botón: crear un usuario tiene su propia dirección, así
    // que se puede abrir en otra pestaña, compartir y recargar.
    <Button asChild className='space-x-1'>
      <Link to='/users/nuevo'>
        <span>Agregar usuario</span> <IconUserPlus size={18} />
      </Link>
    </Button>
  )
}
