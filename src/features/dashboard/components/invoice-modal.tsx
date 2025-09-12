import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { downloadInvoice, downloadBlobAsFile } from '../services/invoice.service'
import { type Venta } from '../models/sales.model'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  venta: Venta
}

export function InvoiceModal({ isOpen, onClose, venta }: InvoiceModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownloadInvoice = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await downloadInvoice(venta.numeroTransaccion)
      downloadBlobAsFile(response.data, response.filename)
      onClose() // Cerrar modal después de descargar exitosamente
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al descargar la factura')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center pb-2">
          <DialogTitle className="text-lg font-semibold">
            Factura de {venta.cliente.nombre} {venta.cliente.apellido}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6 px-4">
          {!error && (
            <div className="flex flex-col items-center space-y-6 w-full">
              <div className="text-muted-foreground text-sm">
                Transacción: <span className="font-medium">{venta.numeroTransaccion}</span>
              </div>
              <Button
                onClick={handleDownloadInvoice}
                disabled={isLoading}
                className="flex items-center gap-2 w-full max-w-xs"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                Descargar Factura
              </Button>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center space-y-4 w-full">
              <div className="text-destructive text-center">{error}</div>
              <Button onClick={onClose} variant="outline" className="w-full max-w-xs">
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
