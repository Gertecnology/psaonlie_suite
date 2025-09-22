import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useEmpresasList } from '@/features/dashboard/hooks/use-empresas-list'
import { useAssignServiceChargeToCompany } from '../hooks/use-assign-service-charge-to-company'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AssignServiceChargeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceChargeId: string
  serviceChargeName: string
}

export function AssignServiceChargeDialog({
  open,
  onOpenChange,
  serviceChargeId,
  serviceChargeName,
}: AssignServiceChargeDialogProps) {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { data: empresasData, isLoading } = useEmpresasList({
    search: searchTerm,
    limit: 50,
  })

  const assignServiceCharge = useAssignServiceChargeToCompany()

  const empresas = empresasData?.data || []
  const selectedEmpresa = empresas.find(empresa => empresa.id === selectedEmpresaId)

  const handleAssign = () => {
    if (!selectedEmpresaId) return

    assignServiceCharge.mutate(
      {
        empresaId: selectedEmpresaId,
        serviceChargeId,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          setSelectedEmpresaId('')
          setSearchTerm('')
          import('sonner').then(({ toast }) => {
            toast.success('Service charge asignado', {
              description: `El cargo "${serviceChargeName}" se ha asignado a la empresa correctamente.`,
              duration: 3000,
            })
          })
        },
        onError: (error: unknown) => {
          import('sonner').then(({ toast }) => {
            let message = 'Ha ocurrido un error al asignar el service charge.'
            if (error instanceof Error) {
              message = error.message
            } else if (typeof error === 'string') {
              message = error
            }
            toast.error('Error al asignar', {
              description: message,
              duration: 3000,
            })
          })
        },
      }
    )
  }

  const handleClose = () => {
    onOpenChange(false)
    setSelectedEmpresaId('')
    setSearchTerm('')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Service Charge</DialogTitle>
          <DialogDescription>
            Asigna el cargo "{serviceChargeName}" a una empresa específica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Seleccionar Empresa</label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between"
                >
                  {selectedEmpresa ? selectedEmpresa.nombre : 'Buscar empresa...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput
                    placeholder="Buscar empresa..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {isLoading ? 'Cargando empresas...' : 'No se encontraron empresas.'}
                    </CommandEmpty>
                    <CommandGroup>
                      {empresas.map((empresa) => (
                        <CommandItem
                          key={empresa.id}
                          value={empresa.nombre}
                          onSelect={() => {
                            setSelectedEmpresaId(empresa.id)
                            setSearchOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedEmpresaId === empresa.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{empresa.nombre}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedEmpresaId || assignServiceCharge.isPending}
          >
            {assignServiceCharge.isPending ? 'Asignando...' : 'Asignar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
