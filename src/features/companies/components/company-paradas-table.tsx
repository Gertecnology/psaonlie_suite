import { useState } from 'react'
import { getParadasHomologadas } from '../services/company.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Search, 
  MapPin, 
  Hash,
  Calendar,
  Building2
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface Parada {
  id: string
  idExterno?: number
  descripcion?: string
}

interface CompanyParadasTableProps {
  empresaId: string
}

export function CompanyParadasTable({ empresaId }: CompanyParadasTableProps) {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'idExterno' | 'descripcion'>('descripcion')

  const { data, isLoading, error } = useQuery({
    queryKey: ['company-paradas', empresaId, page, limit, searchTerm, sortBy],
    queryFn: () => getParadasHomologadas(empresaId, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })

  const filteredItems = data?.items?.filter((parada: Parada) => {
    if (!parada) return false
    
    const descripcion = parada.descripcion || ''
    const idExterno = parada.idExterno || 0
    
    return descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
           idExterno.toString().includes(searchTerm)
  }) || []

  const sortedItems = [...filteredItems].sort((a: Parada, b: Parada) => {
    if (sortBy === 'idExterno') {
      const aId = a.idExterno || 0
      const bId = b.idExterno || 0
      return aId - bId
    }
    
    const aDesc = a.descripcion || ''
    const bDesc = b.descripcion || ''
    return aDesc.localeCompare(bDesc)
  })

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // Removido el scroll automático
  }

  const handleLimitChange = (newLimit: string) => {
    setLimit(Number(newLimit))
    setPage(1) // Reset to first page when changing limit
  }

  const clearSearch = () => {
    setSearchTerm('')
    setPage(1)
  }

  // Función para generar números de página únicos
  const generatePageNumbers = () => {
    const pages: number[] = []
    const totalPages = data?.totalPages || 0
    
    if (totalPages <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Lógica para páginas con elipsis
      if (page <= 4) {
        // Páginas iniciales: 1, 2, 3, 4, 5, ..., totalPages
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push(-1) // Elipsis
        pages.push(totalPages)
      } else if (page >= totalPages - 3) {
        // Páginas finales: 1, ..., totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages
        pages.push(1)
        pages.push(-1) // Elipsis
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Páginas intermedias: 1, ..., page-1, page, page+1, ..., totalPages
        pages.push(1)
        pages.push(-1) // Elipsis
        for (let i = page - 1; i <= page + 1; i++) {
          pages.push(i)
        }
        pages.push(-1) // Elipsis
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <MapPin className="h-5 w-5" />
            Error al cargar paradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Ocurrió un error al cargar las paradas homologadas.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='mt-6'>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Paradas Homologadas
          {data && (
            <Badge variant="secondary" className="ml-2">
              {data.total} paradas
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles de búsqueda y filtros */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSearch}
                className="shrink-0"
              >
                Limpiar
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por:</span>
            <Select value={sortBy} onValueChange={(value: 'idExterno' | 'descripcion') => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="descripcion">Descripción</SelectItem>
                <SelectItem value="idExterno">ID Externo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Hash className="h-4 w-4" />
                    #
                  </div>
                </TableHead>
                <TableHead className="w-24">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    ID Externo
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Descripción
                  </div>
                </TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Empresa
                  </div>
                </TableHead>
                <TableHead className="w-32">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Estado
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeletons de carga
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : sortedItems.length > 0 ? (
                // Datos reales
                sortedItems.map((parada: Parada, index: number) => (
                  <TableRow key={parada.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-center text-sm text-muted-foreground font-medium">
                      {((page - 1) * limit) + index + 1}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {parada.idExterno || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {parada.descripcion || 'Sin descripción'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        Activa
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-xs text-muted-foreground">Habilitada</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                // Estado vacío
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground font-medium">
                        {searchTerm ? 'No se encontraron paradas' : 'No hay paradas homologadas'}
                      </p>
                      {searchTerm && (
                        <Button variant="outline" size="sm" onClick={clearSearch}>
                          Limpiar búsqueda
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación y controles */}
        {data && data.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mostrar:</span>
                <Select value={limit.toString()} onValueChange={handleLimitChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, data.total)} de {data.total} paradas
              </div>
            </div>

            {/* Paginación mejorada */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {generatePageNumbers().map((pageNum, index) => (
                  pageNum === -1 ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={`page-${pageNum}`}
                      variant={pageNum === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 