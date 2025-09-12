import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientsContext } from '../context/clients-context'

export function ClientsPrimaryButtons() {
  const { setIsCreateDialogOpen } = useClientsContext()

  return (
    <Button onClick={() => setIsCreateDialogOpen(true)}>
      <Plus className='mr-2 h-4 w-4' />
      Nuevo Cliente
    </Button>
  )
}
