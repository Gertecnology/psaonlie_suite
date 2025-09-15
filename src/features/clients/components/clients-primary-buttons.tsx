import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useClientDialog } from '../store/use-client-dialog'

export function ClientsPrimaryButtons() {
  const { openDialog } = useClientDialog()

  return (
    <Button onClick={() => openDialog('create')}>
      <Plus className='mr-2 h-4 w-4' />
      Nuevo Cliente
    </Button>
  )
}
