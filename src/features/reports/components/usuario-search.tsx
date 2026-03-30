import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
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
import { usersService } from '../../users/services/users.service'

interface Usuario {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface UsuarioSearchProps {
  value: string | undefined
  onValueChange: (value: string | undefined) => void
  placeholder?: string
}

export function UsuarioSearch({
  value,
  onValueChange,
  placeholder = 'Buscar usuario...',
}: Readonly<UsuarioSearchProps>) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const selectedUsuario = useMemo(() => {
    return usuarios.find((usuario) => usuario.id === value)
  }, [usuarios, value])

  const filteredUsuarios = usuarios

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const nextPage = page + 1
      const response = await usersService.getUsers({
        search: searchTerm,
        page: nextPage,
        limit: 20,
      })

      if (response?.data && response.data.length > 0) {
        setUsuarios((prev) => [...prev, ...response.data])
        setPage(nextPage)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error loading more users', error)
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
      const response = await usersService.getUsers({
        search: term,
        page: 1,
        limit: 20,
      })
      setUsuarios(response?.data || [])
      setHasMore((response?.data || []).length === 20)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error searching users', error)
      setUsuarios([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSelect = useCallback(
    (usuarioId: string) => {
      onValueChange(usuarioId)
      setOpen(false)
    },
    [onValueChange]
  )

  // Cargar datos cuando se abre el popover
  useEffect(() => {
    if (open && usuarios.length === 0) {
      handleSearchChange('')
    }
  }, [open, usuarios.length, handleSearchChange])

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

  const displayName = selectedUsuario
    ? `${selectedUsuario.firstName} ${selectedUsuario.lastName}`
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

          <CommandList style={{ height: '256px', overflowY: 'auto' }} ref={scrollRef} className="max-h-none">
            {usuarios.length === 0 && !isLoading && (
              <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredUsuarios.map((usuario) => (
                <CommandItem
                  key={usuario.id}
                  value={usuario.id}
                  onSelect={() => handleSelect(usuario.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === usuario.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className='flex flex-col text-sm'>
                    <span>
                      {usuario.firstName} {usuario.lastName}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      {usuario.email}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {isLoading && (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-4 w-4 animate-spin' />
              </div>
            )}
            {!hasMore && usuarios.length > 0 && (
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
