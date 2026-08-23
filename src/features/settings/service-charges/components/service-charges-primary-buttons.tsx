import { Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function ServiceChargesPrimaryButtons() {
  return (
    // Un enlace y no un botón: crear un cargo tiene su propia dirección, así
    // que se puede abrir en otra pestaña, compartir y recargar.
    <Button asChild>
      <Link to='/settings/service-charges/nuevo'>
        <Plus className='mr-2 h-4 w-4' />
        Nuevo cargo
      </Link>
    </Button>
  )
}
