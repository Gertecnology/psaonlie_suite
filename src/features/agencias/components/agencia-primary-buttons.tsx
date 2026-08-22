import { IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useAgenciaDialog } from '../store/use-agencia-dialog'

export function AgenciaPrimaryButtons() {
  const { openDialog } = useAgenciaDialog()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => openDialog('create')}>
        <span>Crear Empresa</span> <IconPlus size={18} />
      </Button>
    </div>
  )
}
