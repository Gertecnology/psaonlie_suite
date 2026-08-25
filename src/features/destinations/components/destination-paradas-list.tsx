import { useState, useMemo } from 'react'
import {
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RemoveParadaDialog } from './remove-parada-dialog'

interface Parada {
  id: string
  nombre: string
  activo: boolean
  empresaNombre: string
}

interface DestinationParadasListProps {
  paradas: Parada[]
  destinationName: string
  destinationId: string
}

export function DestinationParadasList({
  paradas,
  destinationName,
  destinationId,
}: DestinationParadasListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'active' | 'inactive'
  >('all')
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'status'>('name')

  // Estado para el diálogo de remover parada
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedParada, setSelectedParada] = useState<Parada | null>(null)

  const filteredAndSortedParadas = useMemo(() => {
    const filtered = paradas.filter((parada) => {
      const matchesSearch =
        parada.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parada.empresaNombre.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && parada.activo) ||
        (statusFilter === 'inactive' && !parada.activo)

      return matchesSearch && matchesStatus
    })

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.nombre.localeCompare(b.nombre)
        case 'company':
          return a.empresaNombre.localeCompare(b.empresaNombre)
        case 'status':
          return a.activo === b.activo ? 0 : a.activo ? -1 : 1
        default:
          return 0
      }
    })

    return filtered
  }, [paradas, searchTerm, statusFilter, sortBy])

  const handleRemoveParada = (parada: Parada) => {
    setSelectedParada(parada)
    setRemoveDialogOpen(true)
  }

  const handleCloseRemoveDialog = () => {
    setRemoveDialogOpen(false)
    setSelectedParada(null)
  }

  if (paradas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <MapPin className='h-5 w-5' />
            Paradas Homologadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='text-muted-foreground py-8 text-center'>
            <MapPin className='mx-auto mb-4 h-12 w-12 opacity-50' />
            <p className='text-lg font-medium'>No hay paradas homologadas</p>
            <p className='text-sm'>
              Este destino aún no tiene paradas registradas.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <MapPin className='h-5 w-5' />
              Paradas Homologadas
              <Badge variant='secondary' className='ml-2'>
                {paradas.length}
              </Badge>
            </CardTitle>

            {/* Filtros y búsqueda */}
            <div className='flex flex-col gap-2 sm:flex-row'>
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                <Input
                  placeholder='Buscar paradas...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full pl-10 sm:w-48'
                />
              </div>

              <Select
                value={statusFilter}
                onValueChange={(value: 'all' | 'active' | 'inactive') =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className='w-full sm:w-32'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos</SelectItem>
                  <SelectItem value='active'>Activas</SelectItem>
                  <SelectItem value='inactive'>Inactivas</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value: 'name' | 'company' | 'status') =>
                  setSortBy(value)
                }
              >
                <SelectTrigger className='w-full sm:w-36'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='name'>Por Nombre</SelectItem>
                  <SelectItem value='company'>Por Empresa</SelectItem>
                  <SelectItem value='status'>Por Estado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredAndSortedParadas.length === 0 ? (
            <div className='text-muted-foreground py-8 text-center'>
              <Filter className='mx-auto mb-4 h-12 w-12 opacity-50' />
              <p className='text-lg font-medium'>No se encontraron paradas</p>
              <p className='text-sm'>
                Intenta ajustar los filtros de búsqueda.
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              {filteredAndSortedParadas.map((parada) => (
                <div
                  key={parada.id}
                  className='bg-muted/30 hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors'
                >
                  <div className='flex min-w-0 flex-1 items-center gap-3'>
                    {parada.activo ? (
                      <CheckCircle className='text-estado-ok h-4 w-4 shrink-0' />
                    ) : (
                      <XCircle className='text-muted-foreground h-4 w-4 shrink-0' />
                    )}

                    <div className='min-w-0 flex-1'>
                      <div className='truncate font-medium'>
                        {parada.nombre}
                      </div>
                      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                        <Building2 className='h-3 w-3' />
                        <span className='truncate'>{parada.empresaNombre}</span>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-shrink-0 items-center gap-2'>
                    <Badge
                      variant={parada.activo ? 'default' : 'secondary'}
                      className='text-xs'
                    >
                      {parada.activo ? (
                        <span className='flex items-center gap-1'>
                          <CheckCircle className='h-3 w-3' />
                          Activa
                        </span>
                      ) : (
                        <span className='flex items-center gap-1'>
                          <XCircle className='h-3 w-3' />
                          Inactiva
                        </span>
                      )}
                    </Badge>

                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemoveParada(parada)}
                      className='text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0'
                      title='Remover parada del destino'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Información de resultados */}
          {filteredAndSortedParadas.length > 0 && (
            <div className='text-muted-foreground mt-4 border-t pt-4 text-center text-sm'>
              Mostrando {filteredAndSortedParadas.length} de {paradas.length}{' '}
              paradas
              {searchTerm && ` que coinciden con "${searchTerm}"`}
              {statusFilter !== 'all' &&
                ` (${statusFilter === 'active' ? 'activas' : 'inactivas'})`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmación para remover parada */}
      {selectedParada && (
        <RemoveParadaDialog
          open={removeDialogOpen}
          onOpenChange={handleCloseRemoveDialog}
          destinationId={destinationId}
          paradaId={selectedParada.id}
          paradaNombre={selectedParada.nombre}
          destinationNombre={destinationName}
        />
      )}
    </>
  )
}
