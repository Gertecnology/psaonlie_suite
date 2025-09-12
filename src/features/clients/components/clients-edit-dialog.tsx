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

export function ClientsEditDialog() {
  const { 
    isEditDialogOpen, 
    setIsEditDialogOpen, 
    selectedClient 
  } = useClientsContext()

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Modifica la información del cliente.
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='edit-nombre' className='text-right'>
              Nombre
            </Label>
            <Input 
              id='edit-nombre' 
              className='col-span-3' 
              defaultValue={selectedClient?.cliente.nombre}
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='edit-apellido' className='text-right'>
              Apellido
            </Label>
            <Input 
              id='edit-apellido' 
              className='col-span-3' 
              defaultValue={selectedClient?.cliente.apellido}
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='edit-email' className='text-right'>
              Email
            </Label>
            <Input 
              id='edit-email' 
              type='email' 
              className='col-span-3' 
              defaultValue={selectedClient?.cliente.email}
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='edit-documento' className='text-right'>
              Documento
            </Label>
            <Input 
              id='edit-documento' 
              className='col-span-3' 
              defaultValue={selectedClient?.cliente.numeroDocumento}
            />
          </div>
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label htmlFor='edit-telefono' className='text-right'>
              Teléfono
            </Label>
            <Input 
              id='edit-telefono' 
              className='col-span-3' 
              defaultValue={selectedClient?.cliente.telefono}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setIsEditDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setIsEditDialogOpen(false)}>
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
