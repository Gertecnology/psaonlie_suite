import { IconMailPlus, IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useUsers } from '../context/users-context'

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers()
  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={() => setOpen('invite')}
      >
        <span>Invitar Usuario</span> <IconMailPlus size={18} />
      </Button>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Agregar Usuario</span> <IconUserPlus size={18} />
      </Button>
    </div>
  )
}
