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
import { getDestinations } from '../../destinations/services/destination.service'

interface Destino {
  id: string
  nombre: string
}

interface DestinoSearchProps {
  value: string | undefined
  onValueChange: (value: string | undefined) => void
  placeholder?: string
}

export function DestinoSearch({
  value,
  onValueChange,
  placeholder = 'Buscar destino...',
}: Readonly<DestinoSearchProps>) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [destinos, setDestinos] = useState<Destino[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedDestino = useMemo(() => {
    return destinos.find((d) => d.id === value)
  }, [destinos, value])

  const filteredDestinos = destinos

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = page + 1
      const response = await getDestinations({
        search: searchTerm,
        page: String(nextPage),
        limit: '20',
      })

      if (response?.items && response.items.length > 0) {
        setDestinos((prev) => [...prev, ...response.items])
        setPage(nextPage)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading more destinos', error)
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
      const response = await getDestinations({
        search: term,
        page: '1',
        limit: '20',
      })
      setDestinos(response?.items || [])
      setHasMore((response?.items || []).length === 20)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error searching destinos', error)
      setDestinos([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSelect = useCallback(
    (destinoId: string) => {
      onValueChange(destinoId)
      setOpen(false)
    },
    [onValueChange]
  )

  // Cargar datos cuando se abre el popover
  useEffect(() => {
    if (open && destinos.length === 0) {
      handleSearchChange('')
    }
  }, [open, destinos.length, handleSearchChange])

  // Listener para scroll infinito
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

  const displayName = selectedDestino ? selectedDestino.nombre : placeholder

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
            {destinos.length === 0 && !isLoading && (
              <CommandEmpty>No se encontraron destinos.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredDestinos.map((destino) => (
                <CommandItem
                  key={destino.id}
                  value={destino.id}
                  onSelect={() => handleSelect(destino.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === destino.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {destino.nombre}
                </CommandItem>
              ))}
            </CommandGroup>
            {isLoading && (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-4 w-4 animate-spin' />
              </div>
            )}
            {!hasMore && destinos.length > 0 && (
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
