import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useServiceChargeDialog } from '../store/use-service-charge-dialog'

export function ServiceChargesPrimaryButtons() {
  const { openDialog } = useServiceChargeDialog()

  return (
    <Button onClick={() => openDialog('create')}>
      <Plus className='mr-2 h-4 w-4' />
      Nuevo Cargo
    </Button>
  )
}
