import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useClientsContext } from '../context/clients-context'

export function ClientsDeleteDialog() {
  const { 
    isDeleteDialogOpen, 
    setIsDeleteDialogOpen, 
    selectedClient 
  } = useClientsContext()

  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Eliminar Cliente</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
          <div className='text-sm text-muted-foreground'>
            Cliente: {selectedClient?.cliente.nombre} {selectedClient?.cliente.apellido}
          </div>
          <div className='text-sm text-muted-foreground'>
            Email: {selectedClient?.cliente.email}
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => setIsDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button variant='destructive' onClick={() => setIsDeleteDialogOpen(false)}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
