import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useExternalData } from '../hooks/use-external-data'
import { ExternalDataFilters } from '../services/external-data.service'

interface ExternalDataTableProps {
  filters?: ExternalDataFilters
}

export function ExternalDataTable({ filters = {} }: ExternalDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [pageSize, setPageSize] = useState(50)

  const {
    data,
    totalItems,
    totalPages,
    currentPage,
    hasNextPage,
    hasPreviousPage,
    isLoading,
    error,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    allDataCount,
    filteredDataCount,
  } = useExternalData({
    filters,
    pageSize,
    searchTerm,
  })


  const formatTime = (time: string) => {
    // Si el tiempo ya está en formato HH:mm, devolverlo tal como está
    if (time.match(/^\d{2}:\d{2}$/)) {
      return time
    }
    // Si es un timestamp o formato diferente, intentar formatearlo
    try {
      const date = new Date(time)
      return date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    } catch {
      return time
    }
  }

  const formatDays = (days: string) => {
    if (!days) return '-'
    // Si son números, convertirlos a días de la semana
    const dayMap: { [key: string]: string } = {
      '1': 'Lun',
      '2': 'Mar', 
      '3': 'Mié',
      '4': 'Jue',
      '5': 'Vie',
      '6': 'Sáb',
      '7': 'Dom',
    }
    
    return days.split(',').map(day => dayMap[day.trim()] || day.trim()).join(', ')
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-red-600 font-medium">Error al cargar los datos</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : 'Error desconocido'}
            </p>
            <Button onClick={() => refetch()} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Datos Externos</CardTitle>
            <CardDescription>
              {isLoading ? (
                'Cargando datos...'
              ) : (
                <>
                  Página {currentPage} de {totalPages} - Mostrando {data.length} de {filteredDataCount} registros 
                  {searchTerm && ` (${allDataCount} total)`}
                </>
              )}
            </CardDescription>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Barra de búsqueda y controles */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, destino, horario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mostrar:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabla de datos */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Días</TableHead>
                <TableHead>Boletería</TableHead>
                <TableHead>Servicios</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Contacto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                      Cargando datos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : !data || data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron resultados para la búsqueda' : 'No hay datos disponibles'}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={`${item.id}-${currentPage}-${index}`}>
                    <TableCell className="font-medium">{item.empresa}</TableCell>
                    <TableCell>{item.destino}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatTime(item.horario)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatDays(item.dias)}</TableCell>
                    <TableCell>{item.boleteria}</TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate" title={item.tiposServicio}>
                        {item.tiposServicio}
                      </div>
                    </TableCell>
                    <TableCell>{item.formaPago}</TableCell>
                    <TableCell>
                      <div className="max-w-24 truncate" title={item.contacto}>
                        {item.contacto}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} ({totalItems} registros)
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(1)}
                disabled={!hasPreviousPage || isLoading}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className="w-8 h-8 p-0"
                      disabled={isLoading}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={!hasNextPage || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(totalPages)}
                disabled={!hasNextPage || isLoading}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
