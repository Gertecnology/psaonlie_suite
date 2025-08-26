import { useState } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRemoveParadaHomologada } from '../hooks/use-remove-parada-homologada'

interface RemoveParadaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  destinationId: string
  paradaId: string
  paradaNombre: string
  destinationNombre: string
}

export function RemoveParadaDialog({
  open,
  onOpenChange,
  destinationId,
  paradaId,
  paradaNombre,
  destinationNombre,
}: RemoveParadaDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const removeParada = useRemoveParadaHomologada()

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await removeParada.mutateAsync({ destinationId, paradaId })
      onOpenChange(false)
    } finally {
      setIsConfirming(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Remover Parada del Destino</DialogTitle>
              <DialogDescription>
                ¿Estás seguro de que quieres remover esta parada del destino?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Destino:</span>
                <span className="text-sm text-muted-foreground">{destinationNombre}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">Parada:</span>
                <span className="text-sm text-muted-foreground">{paradaNombre}</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium">Acción irreversible</p>
                <p>Esta acción no se puede deshacer. La parada será removida del destino pero no se eliminará del sistema.</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isConfirming}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="gap-2"
          >
            {isConfirming ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Removiendo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Remover Parada
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
