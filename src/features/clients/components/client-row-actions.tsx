import { Link } from '@tanstack/react-router'
import { MoreHorizontal, SquareArrowOutUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { type ClienteConEstadisticas } from '../models/clients.model'

interface ClientRowActionsProps {
  cliente: ClienteConEstadisticas
}

/**
 * Row menu for the client list.
 *
 * It lives in its own file so `clients-columns.tsx` exports only the column
 * factory: a module that exports a component next to a plain function loses
 * fast refresh, which is why agencias keeps its row actions apart too.
 *
 * Antes ofrecía «Ver detalles» y «Editar» por separado, que abrían dos
 * pantallas distintas del mismo cliente sin forma de pasar de una a la otra.
 * Ahora hay una sola ficha.
 */
export function ClientRowActions({ cliente }: ClientRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>
            Abrir menú de acciones de {cliente.cliente.nombreCompleto}
          </span>
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        {/* Un enlace y no un `onClick`: se puede abrir en otra pestaña y la
            ficha tiene una dirección propia. El parámetro es el email porque es
            la clave con la que la API identifica al cliente. */}
        <DropdownMenuItem asChild>
          <Link to='/clients/$email' params={{ email: cliente.cliente.email }}>
            <SquareArrowOutUpRight className='mr-2 h-4 w-4' />
            Abrir ficha
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
