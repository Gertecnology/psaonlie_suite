import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
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
import { getClientesList } from '../../clients/services/clients.service'

interface Cliente {
  cliente: {
    id: string
    nombreCompleto?: string
    nombre: string
    apellido: string
  }
}

interface ClienteSearchProps {
  value: string | undefined
  onValueChange: (value: string | undefined) => void
  placeholder?: string
}

export function ClienteSearch({
  value,
  onValueChange,
  placeholder = 'Buscar cliente...',
}: Readonly<ClienteSearchProps>) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const selectedCliente = useMemo(() => {
    return clientes.find((c) => c.cliente.id === value)
  }, [clientes, value])

  const filteredClientes = clientes

  const getClienteLabel = (cliente: Cliente) => {
    return (
      cliente.cliente.nombreCompleto ||
      `${cliente.cliente.nombre} ${cliente.cliente.apellido}`
    )
  }

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = page + 1
      const response = await getClientesList({
        termino: searchTerm,
        page: nextPage,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      })

      if (response?.data && response.data.length > 0) {
        setClientes((prev) => [...prev, ...response.data])
        setPage(nextPage)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading more clientes', error)
    } finally {
      setIsLoading(false)
    }
  }, [page, searchTerm, isLoading, hasMore])

  const handleSearchChange = useCallback(async (term: string) => {
    setSearchTerm(term)
    setPage(1)
    setHasMore(true)
    setIsLoading(true)

    try {
      const response = await getClientesList({
        termino: term,
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      })
      setClientes(response?.data || [])
      setHasMore((response?.data || []).length === 20)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error searching clientes', error)
      setClientes([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSelect = useCallback(
    (clienteId: string) => {
      onValueChange(clienteId)
      setOpen(false)
    },
    [onValueChange]
  )

  // Cargar datos cuando se abre el popover
  useEffect(() => {
    if (open && clientes.length === 0) {
      handleSearchChange('')
    }
  }, [open, clientes.length, handleSearchChange])

  // Ref y listener para scroll infinito
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement || isLoading || !hasMore) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight)

      if (distanceFromBottom < 100 && !isLoading && hasMore) {
        loadMore()
      }
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [isLoading, hasMore, loadMore])

  const displayName = selectedCliente
    ? getClienteLabel(selectedCliente)
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='h-10 w-full justify-between'
          disabled={false}
        >
          {displayName}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-[--radix-popover-trigger-width] p-0'
        align='start'
        onWheel={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={handleSearchChange}
          />
          <CommandList
            style={{ height: '256px', overflowY: 'auto' }}
            ref={scrollRef}
            className='max-h-none'
          >
            {clientes.length === 0 && !isLoading && (
              <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredClientes.map((cliente) => (
                <CommandItem
                  key={cliente.cliente.id}
                  value={cliente.cliente.id}
                  onSelect={() => handleSelect(cliente.cliente.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === cliente.cliente.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {getClienteLabel(cliente)}
                </CommandItem>
              ))}
            </CommandGroup>
            {isLoading && (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-4 w-4 animate-spin' />
              </div>
            )}
            {!hasMore && clientes.length > 0 && (
              <div className='text-muted-foreground py-4 text-center text-xs'>
                Has llegado al final
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
