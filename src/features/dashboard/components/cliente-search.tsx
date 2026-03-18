import { useState, useMemo, useCallback, useEffect } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useClientesList } from '../hooks/use-clientes-list'
import { type ClienteConEstadisticas } from '../models/clients.model'

interface ClienteSearchProps {
  onClienteSelect: (clienteId: string | null) => void
  selectedClienteId?: string | null
  placeholder?: string
  className?: string
}

export function ClienteSearch({ onClienteSelect, selectedClienteId, placeholder = "Buscar cliente...", className }: ClienteSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<ClienteConEstadisticas | null>(null)

  // Parámetros de búsqueda para el hook
  const searchParams = useMemo(() => ({
    termino: searchTerm,
    limit: 10, // Limitar resultados para mejor rendimiento
  }), [searchTerm])

  const { data: clientesData, isLoading } = useClientesList(searchParams)

  const clientes = useMemo(() => {
    return clientesData?.data || []
  }, [clientesData])

  // Sincronizar el estado local con el prop selectedClienteId
  useEffect(() => {
    if (!selectedClienteId) {
      setSelectedCliente(null)
    } else if (selectedCliente?.cliente.id !== selectedClienteId) {
      // Buscar el cliente seleccionado en los datos actuales
      const cliente = clientes.find(c => c.cliente.id === selectedClienteId)
      if (cliente) {
        setSelectedCliente(cliente)
      }
    }
  }, [selectedClienteId, clientes, selectedCliente?.cliente.id])

  const handleSelect = useCallback((cliente: ClienteConEstadisticas) => {
    setSelectedCliente(cliente)
    setOpen(false)
    onClienteSelect(cliente.cliente.id)
  }, [onClienteSelect])

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-8"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {selectedCliente 
                  ? `${selectedCliente.cliente.nombre} ${selectedCliente.cliente.apellido}`
                  : placeholder
                }
              </span>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(520px,calc(100vw-2rem))] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Buscar por nombre, apellido o email..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Buscando..." : "No se encontraron clientes."}
              </CommandEmpty>
              <CommandGroup>
                {clientes.map((cliente) => (
                  <CommandItem
                    key={cliente.cliente.id}
                    value={`${cliente.cliente.nombre} ${cliente.cliente.apellido} ${cliente.cliente.email}`}
                    onSelect={() => handleSelect(cliente)}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3"
                  >
                    <div className="min-w-0">
                      <span className="block font-medium truncate">
                        {cliente.cliente.nombre} {cliente.cliente.apellido}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        {cliente.cliente.email}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                      {cliente.estadisticasVentas.totalVentas} ventas
                    </span>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedCliente?.cliente.id === cliente.cliente.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
