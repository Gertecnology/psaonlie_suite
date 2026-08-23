import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useAgenciasList } from '@/features/dashboard/hooks/use-agencias-list'
import { useAssignServiceChargeToCompany } from '../hooks/use-assign-service-charge-to-company'

interface AssignServiceChargeDialogProps {
  open: boolean
  onClose: () => void
  serviceChargeId: string
  serviceChargeName: string
}

/**
 * Assigning a charge stays a dialog on purpose.
 *
 * The forms became pages because they hold work in progress: a dozen fields
 * worth losing, a URL worth sharing. This is neither — it is a single decision
 * ("which company") taken over a charge the user already picked from its own
 * row, and confirmed in one step. A page for it would mean two navigations to
 * answer one question.
 */
export function AssignServiceChargeDialog({
  open,
  onClose,
  serviceChargeId,
  serviceChargeName,
}: AssignServiceChargeDialogProps) {
  const [empresaId, setEmpresaId] = React.useState('')
  const [listaAbierta, setListaAbierta] = React.useState(false)
  const [busqueda, setBusqueda] = React.useState('')

  const { data: empresasData, isLoading } = useAgenciasList({
    search: busqueda,
    limit: 50,
  })

  const assign = useAssignServiceChargeToCompany()

  const empresas = React.useMemo(() => empresasData?.data ?? [], [empresasData])
  const empresaElegida = empresas.find((empresa) => empresa.id === empresaId)

  const cerrar = React.useCallback(() => {
    setEmpresaId('')
    setBusqueda('')
    setListaAbierta(false)
    onClose()
  }, [onClose])

  const asignar = () => {
    if (!empresaId) return

    assign.mutate(
      { agenciaId: empresaId, serviceChargeId, serviceChargeName },
      // Sólo se cierra si la asignación salió bien: si falla, la empresa
      // elegida sigue ahí y el error se ve en el toast.
      { onSuccess: cerrar },
    )
  }

  return (
    <Dialog
      open={open}
      // Radix avisa con un booleano; el diálogo sólo se abre desde afuera, así
      // que acá únicamente interesa el cierre (Escape, clic afuera, botón).
      onOpenChange={(abierto) => {
        if (!abierto) cerrar()
      }}
    >
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Asignar cargo por servicio</DialogTitle>
          <DialogDescription>
            Asigná el cargo «{serviceChargeName}» a una empresa.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-2 py-2'>
          {/* El label apunta al botón que abre la lista: sin `htmlFor` no
              estaba asociado a ningún control y un lector de pantalla
              anunciaba el combobox sin nombre. */}
          <label htmlFor='empresa-asignada' className='text-sm font-medium'>
            Empresa
          </label>
          <Popover open={listaAbierta} onOpenChange={setListaAbierta}>
            <PopoverTrigger asChild>
              <Button
                id='empresa-asignada'
                variant='outline'
                role='combobox'
                aria-expanded={listaAbierta}
                className='w-full justify-between'
              >
                {empresaElegida ? empresaElegida.nombre : 'Buscar empresa…'}
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            {/* Sintaxis de Tailwind 4 para leer una variable CSS: la forma
                `w-[--var]` de la versión 3 ya no genera ninguna regla. */}
            <PopoverContent className='w-(--radix-popover-trigger-width) p-0'>
              <Command>
                <CommandInput
                  placeholder='Buscar empresa…'
                  value={busqueda}
                  onValueChange={setBusqueda}
                />
                <CommandList>
                  <CommandEmpty>
                    {isLoading
                      ? 'Cargando empresas…'
                      : 'No se encontraron empresas.'}
                  </CommandEmpty>
                  <CommandGroup>
                    {empresas.map((empresa) => (
                      <CommandItem
                        key={empresa.id}
                        value={empresa.nombre}
                        onSelect={() => {
                          setEmpresaId(empresa.id)
                          setListaAbierta(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            empresaId === empresa.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {empresa.nombre}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={cerrar} disabled={assign.isPending}>
            Cancelar
          </Button>
          <Button onClick={asignar} disabled={!empresaId || assign.isPending}>
            {assign.isPending ? 'Asignando…' : 'Asignar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
