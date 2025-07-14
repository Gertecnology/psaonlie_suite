import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useDestinationDialog } from '../store/use-destination-dialog'

export function DestinationPrimaryButtons() {
  const { openDialog } = useDestinationDialog()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => openDialog('create')}>
        <span>Crear Empresa</span> <IconPlus size={18} />
      </Button>
    </div>
  )
}
