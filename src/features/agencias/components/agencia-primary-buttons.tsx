import { IconPlus } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

/**
 * Creating a company is a page with its own address, not a side drawer: it can
 * be linked, it survives a reload, and the back button undoes the step instead
 * of discarding the form.
 */
export function AgenciaPrimaryButtons() {
  return (
    <Button asChild className='space-x-1'>
      <Link to='/agencias/nueva'>
        <span>Crear empresa</span> <IconPlus size={18} />
      </Link>
    </Button>
  )
}
