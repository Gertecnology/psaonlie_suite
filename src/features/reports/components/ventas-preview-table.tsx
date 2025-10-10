import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Eye, EyeOff, Loader2, AlertCircle, RefreshCw, FileSpreadsheet, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState } from 'react'
import { useVentasList } from '../../dashboard/hooks/use-ventas-list'
import type { ExportFilters } from '../models/reports.model'
import type { VentasSearchParams } from '../../dashboard/models/sales.model'
import type { PreviewData } from '../services/preview.service'
import { convertToCSV, convertToExcel, getTableColumns, flattenDataForTable } from '../utils/export-formatters'

interface VentasPreviewTableProps {
  filters: ExportFilters
  isVisible: boolean
  onToggleVisibility: () => void
}

// Función para formatear moneda
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Función para formatear fecha sin hora
const formatDateOnly = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  } catch {
    return dateString
  }
}

// Componente para mostrar tabla tipo Excel
const ExcelPreviewTable = ({ data }: { data: unknown[] }) => {
  const columns = getTableColumns()
  const flattenedData = flattenDataForTable(data as PreviewData[])

  // Calcular el ancho total de la tabla
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0)

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="h-[500px] overflow-auto">
        <div style={{ minWidth: `${totalWidth}px` }}>
          {/* Encabezados */}
          <div className="sticky top-0 bg-gray-50 border-b z-10">
            <div className="flex">
              {columns.map((column) => (
                <div
                  key={column.key}
                  className="px-3 py-2 text-xs font-medium text-gray-700 border-r border-gray-200 flex-shrink-0"
                  style={{ width: column.width, minWidth: column.width }}
                >
                  {column.header}
                </div>
              ))}
            </div>
          </div>

          {/* Filas de datos */}
          <div className="bg-white">
            {flattenedData.map((row, index) => (
              <div
                key={row.id}
                className={`flex border-b border-gray-100 hover:bg-gray-50 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                }`}
              >
                {columns.map((column) => (
                  <div
                    key={column.key}
                    className="px-3 py-2 text-xs text-gray-900 border-r border-gray-100 flex-shrink-0"
                    style={{ width: column.width, minWidth: column.width }}
                    title={String(row[column.key as keyof typeof row] || '')}
                  >
                    {column.key === 'importeTotal' || column.key === 'comisionTotal' ? (
                      formatCurrency(Number(row[column.key as keyof typeof row] || 0))
                    ) : column.key === 'fechaVenta' || column.key === 'fechaViaje' || column.key === 'createdAt' || column.key === 'updatedAt' ? (
                      formatDateOnly(String(row[column.key as keyof typeof row] || ''))
                    ) : (
                      String(row[column.key as keyof typeof row] || '')
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar vista CSV
const CSVPreview = ({ data }: { data: unknown[] }) => {
  const csvContent = convertToCSV(data as PreviewData[])

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="h-[500px] overflow-auto">
        <pre className="p-4 text-xs font-mono text-gray-900 whitespace-pre-wrap">
          {csvContent}
        </pre>
      </div>
    </div>
  )
}

// Función para convertir ExportFilters a VentasSearchParams
const convertFiltersToSearchParams = (filters: ExportFilters): VentasSearchParams => {
  const searchParams: VentasSearchParams = {
    page: 1,
    limit: 100, // Mostrar hasta 100 registros para previsualización
  }

  // Mapear filtros de estado
  if (filters.estadoPago) searchParams.estadoPago = filters.estadoPago
  if (filters.estadoVenta) searchParams.estadoVenta = filters.estadoVenta
  if (filters.metodoPago) searchParams.metodoPago = filters.metodoPago

  // Mapear filtros de IDs
  if (filters.empresaId) searchParams.empresaId = filters.empresaId
  if (filters.usuarioId) searchParams.usuarioId = filters.usuarioId
  if (filters.clienteId) searchParams.clienteId = filters.clienteId
  if (filters.origenId) searchParams.origenId = filters.origenId
  if (filters.destinoId) searchParams.destinoId = filters.destinoId

  // Mapear filtros de texto
  if (filters.numeroTransaccion) searchParams.numeroTransaccion = filters.numeroTransaccion
  if (filters.nombreEmpresa) searchParams.nombreEmpresa = filters.nombreEmpresa
  if (filters.referenciaPago) searchParams.referenciaPago = filters.referenciaPago
  if (filters.bancardTransactionId) searchParams.bancardTransactionId = filters.bancardTransactionId

  // Mapear filtros de fecha
  if (filters.fechaVentaDesde) searchParams.fechaVentaDesde = filters.fechaVentaDesde
  if (filters.fechaVentaHasta) searchParams.fechaVentaHasta = filters.fechaVentaHasta
  if (filters.fechaViajeDesde) searchParams.fechaViajeDesde = filters.fechaViajeDesde
  if (filters.fechaViajeHasta) searchParams.fechaViajeHasta = filters.fechaViajeHasta

  // Mapear filtros de importe
  if (filters.importeMinimo) searchParams.importeMinimo = filters.importeMinimo
  if (filters.importeMaximo) searchParams.importeMaximo = filters.importeMaximo

  // Mapear ordenamiento
  if (filters.sortBy) searchParams.sortBy = filters.sortBy
  if (filters.sortOrder) searchParams.sortOrder = filters.sortOrder

  return searchParams
}

export function VentasPreviewTable({ filters, isVisible }: VentasPreviewTableProps) {
  const [isExpanded, setIsExpanded] = useState(true) // Mostrar automáticamente cuando hay datos
  
  // Convertir filtros a parámetros de búsqueda
  const searchParams = convertFiltersToSearchParams(filters)
  
  // Usar el hook de ventas para obtener los datos
  const { 
    data: ventasResponse, 
    isLoading, 
    error, 
    refetch 
  } = useVentasList(searchParams)

  const ventasData = ventasResponse?.data || []
  const totalCount = ventasResponse?.total || 0

  // Verificar si hay filtros activos (excluyendo configuración por defecto)
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'formato' || key === 'sortBy' || key === 'sortOrder') {
      return false
    }
    return value !== undefined && value !== null && value !== ''
  })

  if (!isVisible) {
    return null
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error en Previsualización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'Error al cargar la previsualización'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!hasActiveFilters) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Previsualización de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay filtros activos para mostrar la previsualización.</p>
            <p className="text-sm mt-2">Configura los filtros para ver los datos que se exportarán.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Previsualización de Datos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos que coincidan con los filtros seleccionados.</p>
            <p className="text-sm mt-2">Ajusta los filtros para ver los datos de previsualización.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
             <CardTitle className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <Eye className="h-5 w-5" />
                 Datos de Previsualización
               </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {totalCount.toLocaleString()} registro{totalCount !== 1 ? 's' : ''} total
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const csvContent = convertToCSV(ventasData as unknown as PreviewData[])
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const link = document.createElement('a')
                const url = URL.createObjectURL(blob)
                link.setAttribute('href', url)
                link.setAttribute('download', 'preview_ventas.csv')
                link.style.visibility = 'hidden'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              disabled={ventasData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const excelBuffer = convertToExcel(ventasData as unknown as PreviewData[])
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
                const link = document.createElement('a')
                const url = URL.createObjectURL(blob)
                link.setAttribute('href', url)
                link.setAttribute('download', 'preview_ventas.xlsx')
                link.style.visibility = 'hidden'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
              }}
              disabled={ventasData.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Excel
            </Button>
                   <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                     <CollapsibleTrigger asChild>
                       <Button variant="outline" size="sm">
                         {isExpanded ? 'Ocultar' : 'Mostrar'} Datos
                       </Button>
                     </CollapsibleTrigger>
                   </Collapsible>
          </div>
        </CardTitle>
      </CardHeader>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span>Cargando previsualización...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Información de resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{totalCount.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Registros Totales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(ventasData.reduce((sum, item) => sum + item.importeTotal, 0))}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Muestra</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{ventasData.length}</div>
                    <div className="text-sm text-muted-foreground">Mostrando</div>
                  </div>
                </div>

                {/* Vista de previsualización en formato tabla */}
                <Tabs defaultValue="excel" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="excel" className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4" />
                      Vista Excel
                    </TabsTrigger>
                    <TabsTrigger value="csv" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Vista CSV
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="excel" className="mt-4">
                    <ExcelPreviewTable data={ventasData} />
                  </TabsContent>
                  
                  <TabsContent value="csv" className="mt-4">
                    <CSVPreview data={ventasData} />
                  </TabsContent>
                </Tabs>

                {/* Nota informativa */}
                {totalCount > ventasData.length && (
                  <div className="text-center text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                    <p>
                      Mostrando los primeros {ventasData.length} registros de {totalCount.toLocaleString()} totales.
                    </p>
                    <p className="mt-1">
                      El archivo exportado contendrá todos los {totalCount.toLocaleString()} registros que coincidan con los filtros.
                    </p>
                    {totalCount > 100 && (
                      <p className="mt-1 text-xs">
                        💡 Para ver más registros, ajusta los filtros o descarga el archivo completo.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
