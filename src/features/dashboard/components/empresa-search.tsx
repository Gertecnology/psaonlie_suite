import { useState, useMemo, useCallback, useEffect } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useEmpresasList } from '../hooks/use-empresas-list'
import { type Empresa } from '../models/empresas.model'

interface EmpresaSearchProps {
  onEmpresaSelect: (empresaId: string | null) => void
  selectedEmpresaId?: string | null
  placeholder?: string
  className?: string
}

export function EmpresaSearch({ onEmpresaSelect, selectedEmpresaId, placeholder = "Buscar empresa...", className }: Readonly<EmpresaSearchProps>) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null)

  // Obtener todas las empresas (no hay parámetros de búsqueda en este endpoint)
  const { data: empresasData, isLoading } = useEmpresasList()

  const empresas = useMemo(() => {
    if (!empresasData?.data) return []
    
    // Filtrar solo empresas internas (datoExterno: false) y por el término de búsqueda
    return empresasData.data
      .filter(empresa => !empresa.datoExterno) // Solo empresas internas
      .filter(empresa => 
        empresa.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      )
  }, [empresasData?.data, searchTerm])

  // Sincronizar el estado local con el prop selectedEmpresaId
  useEffect(() => {
    if (!selectedEmpresaId) {
      setSelectedEmpresa(null)
    } else if (selectedEmpresa?.id !== selectedEmpresaId) {
      // Buscar la empresa seleccionada en los datos actuales
      const empresa = empresas.find(e => e.id === selectedEmpresaId)
      if (empresa) {
        setSelectedEmpresa(empresa)
      }
    }
  }, [selectedEmpresaId, empresas, selectedEmpresa?.id])

  const handleSelect = useCallback((empresa: Empresa) => {
    setSelectedEmpresa(empresa)
    setOpen(false)
    onEmpresaSelect(empresa.id)
  }, [onEmpresaSelect])

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
                {selectedEmpresa 
                  ? selectedEmpresa.nombre
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
              placeholder="Buscar por nombre de empresa..."
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? "Cargando empresas..." : "No se encontraron empresas."}
              </CommandEmpty>
              <CommandGroup>
                {empresas.map((empresa) => (
                  <CommandItem
                    key={empresa.id}
                    value={empresa.nombre}
                    onSelect={() => handleSelect(empresa)}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"
                  >
                    <div className="min-w-0">
                      <span className="block font-medium truncate">
                        {empresa.nombre}
                      </span>
                      <span className="block text-xs text-muted-foreground truncate">
                        Empresa Interna
                      </span>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4",
                        selectedEmpresa?.id === empresa.id ? "opacity-100" : "opacity-0"
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
