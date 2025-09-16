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
import { useDeleteClient } from '../hooks/use-client-mutations'

export function ClientsDeleteDialog() {
  const { 
    isDeleteDialogOpen, 
    setIsDeleteDialogOpen, 
    selectedClient 
  } = useClientsContext()

  const deleteClient = useDeleteClient()

  const handleDelete = () => {
    if (selectedClient?.cliente.id) {
      deleteClient.mutate(selectedClient.cliente.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          import('sonner').then(({ toast }) => {
            toast.success('Cliente eliminado', {
              description: 'El cliente se ha eliminado correctamente.',
              duration: 3000,
            })
          })
        },
        onError: (error: unknown) => {
          import('sonner').then(({ toast }) => {
            let message = 'Ha ocurrido un error al eliminar el cliente.'
            if (error instanceof Error) {
              message = error.message
            } else if (typeof error === 'string') {
              message = error
            }
            toast.error('Error al eliminar', {
              description: message,
              duration: 3000,
            })
          })
        },
      })
    }
  }

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
          <Button 
            variant='outline' 
            onClick={() => setIsDeleteDialogOpen(false)}
            disabled={deleteClient.isPending}
          >
            Cancelar
          </Button>
          <Button 
            variant='destructive' 
            onClick={handleDelete}
            disabled={deleteClient.isPending}
          >
            {deleteClient.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
