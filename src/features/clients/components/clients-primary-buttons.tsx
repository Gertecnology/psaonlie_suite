import { Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

/**
 * Creating a client is a page with its own address, not a side drawer: it can
 * be linked, it survives a reload, and the back button undoes the step instead
 * of discarding the form.
 */
export function ClientsPrimaryButtons() {
  return (
    <Button asChild>
      <Link to='/clients/nuevo'>
        <Plus className='mr-2 h-4 w-4' />
        Nuevo Cliente
      </Link>
    </Button>
  )
}
