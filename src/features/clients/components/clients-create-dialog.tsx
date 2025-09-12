import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useClientsContext } from '../context/clients-context'

export function ClientsCreateDialog() {
  const { isCreateDialogOpen, setIsCreateDialogOpen } = useClientsContext()

  return (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Crear Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Agrega un nuevo cliente al sistema.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='nombre' className='text-right'>
              Nombre
            </Label>
            <Input id='nombre' className='col-span-3' />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='apellido' className='text-right'>
              Apellido
            </Label>
            <Input id='apellido' className='col-span-3' />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='email' className='text-right'>
              Email
            </Label>
            <Input id='email' type='email' className='col-span-3' />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='documento' className='text-right'>
              Documento
            </Label>
            <Input id='documento' className='col-span-3' />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='telefono' className='text-right'>
              Teléfono
            </Label>
            <Input id='telefono' className='col-span-3' />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setIsCreateDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(false)}>
            Crear Cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
