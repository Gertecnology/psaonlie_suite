import React, { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useGetParadasHomologadas } from '../hooks/use-get-paradas-homologadas'
import type { ParadaHomologada } from '../models/sales.model'

interface ParadaSearchProps {
  value: ParadaHomologada | null
  onValueChange: (value: ParadaHomologada | null) => void
  placeholder?: string
  label?: string
  className?: string
}

export function ParadaSearch({ 
  value, 
  onValueChange, 
  placeholder = "Buscar destino...", 
  label = "Destino",
  className 
}: ParadaSearchProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Only search when user has typed at least 3 characters
  const shouldSearch = searchTerm.length >= 3
  const { data: paradas = [], isLoading } = useGetParadasHomologadas(searchTerm)

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchTerm('')
    }
  }, [open])

  const handleSelect = (parada: ParadaHomologada) => {
    onValueChange(parada)
    setOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onValueChange(null)
    setSearchTerm('')
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {value ? value.nombre : placeholder}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Escribe al menos 3 caracteres..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {!shouldSearch && (
                <CommandEmpty>
                  Escribe al menos 3 caracteres para buscar
                </CommandEmpty>
              )}
              
              {shouldSearch && isLoading && (
                <CommandEmpty>
                  Buscando destinos...
                </CommandEmpty>
              )}
              
              {shouldSearch && !isLoading && paradas.length === 0 && (
                <CommandEmpty>
                  No se encontraron destinos
                </CommandEmpty>
              )}
              
              {shouldSearch && !isLoading && paradas.length > 0 && (
                <CommandGroup>
                  {paradas.map((parada) => (
                    <CommandItem
                      key={parada.id}
                      value={parada.nombre}
                      onSelect={() => handleSelect(parada)}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value?.id === parada.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {parada.nombre}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Limpiar selección
        </Button>
      )}
    </div>
  )
}
