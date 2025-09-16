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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-PY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function ClientsViewDialog() {
  const { 
    isViewDialogOpen, 
    setIsViewDialogOpen, 
    selectedClient 
  } = useClientsContext()

  if (!selectedClient) return null

  return (
    <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
      <DialogContent className='w-[95vw] max-w-[500px] sm:w-full'>
        <DialogHeader>
          <DialogTitle>Detalles del Cliente</DialogTitle>
          <DialogDescription>
            Información completa del cliente seleccionado.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <h4 className='font-medium text-sm text-muted-foreground'>Nombre Completo</h4>
              <p className='text-sm'>{selectedClient.cliente.nombre} {selectedClient.cliente.apellido}</p>
            </div>
            <div>
              <h4 className='font-medium text-sm text-muted-foreground'>Email</h4>
              <p className='text-sm'>{selectedClient.cliente.email}</p>
            </div>
          </div>
          
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <h4 className='font-medium text-sm text-muted-foreground'>Teléfono</h4>
              <p className='text-sm'>{selectedClient.cliente.telefono || 'No especificado'}</p>
            </div>
            <div>
              <h4 className='font-medium text-sm text-muted-foreground'>Nacionalidad</h4>
              <p className='text-sm'>{selectedClient.cliente.nacionalidad || 'No especificado'}</p>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <h4 className='font-medium text-sm text-muted-foreground'>Fecha de Registro</h4>
              <p className='text-sm'>{formatDate(selectedClient.cliente.createdAt)}</p>
            </div>
            <div>
              <h4 className='font-medium text-sm text-muted-foreground'>Ocupación</h4>
              <p className='text-sm'>{selectedClient.cliente.ocupacion || 'No especificado'}</p>
            </div>
          </div>

          <div className='border-t pt-4'>
            <h4 className='font-medium text-sm text-muted-foreground mb-2'>Estadísticas de Ventas</h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <h5 className='font-medium text-sm text-muted-foreground'>Total de Ventas</h5>
                <p className='text-lg font-semibold'>{selectedClient.estadisticasVentas.totalVentas}</p>
              </div>
              <div>
                <h5 className='font-medium text-sm text-muted-foreground'>Monto Total Pagado</h5>
                <p className='text-lg font-semibold'>{formatCurrency(selectedClient.estadisticasVentas.montoTotalPagado)}</p>
              </div>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2'>
              <div>
                <h5 className='font-medium text-sm text-muted-foreground'>Ventas Pagadas</h5>
                <p className='text-sm'>{selectedClient.estadisticasVentas.ventasPagadas}</p>
              </div>
              <div>
                <h5 className='font-medium text-sm text-muted-foreground'>Ventas Pendientes</h5>
                <p className='text-sm'>{selectedClient.estadisticasVentas.ventasPendientes}</p>
              </div>
              <div>
                <h5 className='font-medium text-sm text-muted-foreground'>Ventas Canceladas</h5>
                <p className='text-sm'>{selectedClient.estadisticasVentas.ventasCanceladas}</p>
              </div>
            </div>
            {selectedClient.estadisticasVentas.ultimaVenta && (
              <div className='mt-2'>
                <h5 className='font-medium text-sm text-muted-foreground'>Última Venta</h5>
                <p className='text-sm'>{formatDate(selectedClient.estadisticasVentas.ultimaVenta)}</p>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsViewDialogOpen(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
