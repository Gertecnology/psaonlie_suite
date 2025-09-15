import { useState, useMemo } from 'react'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Empresa {
  id: string
  nombre: string
  datoExterno: boolean
}

interface EmpresaSearchProps {
  empresas: Empresa[]
  isLoading: boolean
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function EmpresaSearch({
  empresas,
  isLoading,
  value,
  onValueChange,
  placeholder = 'Buscar empresa...'
}: EmpresaSearchProps) {
  const [open, setOpen] = useState(false)

  const selectedEmpresa = useMemo(() => {
    return empresas.find((empresa) => empresa.id === value)
  }, [empresas, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={isLoading}
        >
          {isLoading ? (
            'Cargando empresas...'
          ) : selectedEmpresa ? (
            selectedEmpresa.nombre
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No se encontraron empresas.</CommandEmpty>
            <CommandGroup>
              {empresas.map((empresa) => (
                <CommandItem
                  key={empresa.id}
                  value={empresa.nombre}
                  onSelect={() => {
                    onValueChange(empresa.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === empresa.id ? "opacity-100" : "opacity-0"
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
  )
}
