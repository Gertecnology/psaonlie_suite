import { useState } from 'react'
import type React from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  AlertCircle,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useVentasList } from '../../dashboard/hooks/use-ventas-list'
import type { 
  Venta, 
  VentasSearchParams 
} from '../../dashboard/models/sales.model'
import type { ExportFilters } from '../models/reports.model'
import type { PreviewData } from '../services/preview.service'
import {
  convertToCSV,
  convertToExcel,
  flattenDataForTable,
  getTableColumns,
} from '../utils/export-formatters'

interface VentasPreviewTableProps {
  filters: ExportFilters
  isVisible: boolean
  onFilterClick?: (field: string, value: string) => void
}

const ReadyToGenerateState = ({
  description,
}: Readonly<{ description: string }>) => {
  return (
    <div className='rounded-2xl border border-dashed py-16 text-center'>
      <div className='bg-muted mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl'>
        <FileText className='text-muted-foreground h-7 w-7' />
      </div>

      <h3 className='text-foreground text-3xl font-bold'>
        Listo para generar tu reporte
      </h3>
      <p className='text-muted-foreground mx-auto mt-3 max-w-2xl text-base'>
        {description}
      </p>

      <div className='text-muted-foreground mt-8 flex items-center justify-center gap-6 text-sm font-medium tracking-wide uppercase'>
        <div className='flex items-center gap-2'>
          <span className='h-2.5 w-2.5 rounded-full bg-emerald-500' />
          <span>EXCEL (XLSX)</span>
        </div>
        <div className='flex items-center gap-2'>
          <span className='h-2.5 w-2.5 rounded-full bg-blue-500' />
          <span>TEXTO (CSV)</span>
        </div>
      </div>
    </div>
  )
}

// Función para formatear moneda (paraguay)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Función para formatear fecha sin hora
const formatDateOnly = (dateString: string): string => {
  if (!dateString) return '—'
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es })
  } catch {
    return dateString
  }
}

// Colores Semánticos por estado
const getStatusColor = (value: string) => {
  const v = value.toUpperCase()
  // Verdes (Finalizado, Pagado, Confirmado)
  if (['PAGADO', 'CONFIRMADA', 'CONFIRMADO', 'FINALIZADO', 'PAGO_APROBADO'].includes(v)) {
    return 'bg-emerald-100 text-emerald-800'
  }
  // Rojas (Cancelado, Error, Fallido, Anulado, Expirado)
  if (['CANCELADO', 'CANCELADA', 'FALLIDO', 'ANULADO', 'EXPIRADO', 'ERROR'].includes(v)) {
    return 'bg-red-100 text-red-800'
  }
  // Naranjas (Pendiente, Reserva, En Proceso)
  if (['PENDIENTE', 'RESERVADO', 'RESERVADA', 'EN PROCESO', 'PENDIENTE_PAGO'].includes(v)) {
    return 'bg-amber-100 text-amber-800'
  }
  return 'bg-gray-100 text-gray-600'
}

const StatusBadge = ({ value }: { value: string }) => {
  const cls = getStatusColor(value)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] leading-none font-bold tracking-tight ${cls}`}
    >
      {value || '—'}
    </span>
  )
}

// Componente para mostrar tabla tipo Excel
const ExcelPreviewTable = ({ 
  data,
  onFilterClick 
}: { 
  data: Venta[],
  onFilterClick?: (field: string, value: string, label?: string) => void
}) => {
  const baseColumns = getTableColumns()
  // Aumentar columnas con columna de acciones localmente
  const columns = [
    ...baseColumns,
    { key: 'actions', header: 'Acciones', width: 85, align: 'center' as const }
  ]
  
  const flattenedData = flattenDataForTable(data as unknown as PreviewData[])

  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0)

  // Totales de columnas marcadas como summable
  const totals = columns.reduce<Record<string, number>>((acc, col) => {
    if (col.isSummable) {
      acc[col.key] = flattenedData.reduce(
        (sum, row) => sum + (Number(row[col.key as keyof typeof row]) || 0),
        0
      )
    }
    return acc
  }, {})

  const alignClass: Record<string, string> = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  }

  return (
    <TooltipProvider>
      <div className='overflow-hidden rounded-lg border bg-white'>
      <div className='h-[500px] overflow-auto'>
        <div style={{ minWidth: `${totalWidth}px` }}>
          {/* Encabezados */}
          <div className='sticky top-0 z-10 border-b bg-gray-50'>
            <div className='flex'>
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={`shrink-0 border-r border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 ${alignClass[column.align]}`}
                  style={{ width: column.width, minWidth: column.width }}
                >
                  {column.header}
                </div>
              ))}
            </div>
          </div>

          {/* Filas de datos */}
          <div className='bg-white'>
            {flattenedData.map((row, index) => (
              <div
                key={index}
                className={`flex border-b border-gray-100 hover:bg-blue-50/40 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                }`}
              >
                {columns.map((column) => {
                  const rawValue = row[column.key as keyof typeof row]
                  const originalRow = data[index]

                  let cellContent: React.ReactNode
                  if (
                    column.key === 'importeTotal' ||
                    column.key === 'comisionTotal'
                  ) {
                    cellContent = formatCurrency(Number(rawValue || 0))
                  } else if (column.key === 'fechaVenta' || column.key === 'createdAt') {
                    // Fecha Venta/Creado: Estilo secundario (pequeño/gris)
                    cellContent = (
                      <span className='text-[10px] text-gray-500 font-medium'>
                        {formatDateOnly(String(rawValue || ''))}
                      </span>
                    )
                  } else if (column.key === 'fechaViaje' || column.key === 'horaSalida') {
                    // Viaje/Hora: Estilo jerárquico (Negrita/Fuerte)
                    cellContent = (
                      <span className='font-bold text-gray-900'>
                        {column.key === 'horaSalida' ? String(rawValue || '') : formatDateOnly(String(rawValue || ''))}
                      </span>
                    )
                  } else if (column.key === 'estadoPago' || column.key === 'estadoVenta') {
                    cellContent = <StatusBadge value={String(rawValue || '')} />
                  } else if (column.key === 'actions') {
                    cellContent = (
                      <div className='flex items-center justify-center gap-2'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant='ghost' size='icon' className='h-6 w-6 text-blue-600 hover:bg-blue-50'>
                              <Eye className='h-3.5 w-3.5' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Vista Previa</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant='ghost' size='icon' className='h-6 w-6 text-gray-600 hover:bg-gray-100'>
                              <Printer className='h-3.5 w-3.5' />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Imprimir</TooltipContent>
                        </Tooltip>
                      </div>
                    )
                  } else if (['empresaNombre', 'origenNombre', 'destinoNombre'].includes(column.key)) {
                    // Interactividad: Clic para filtrar
                    const fieldMap: Record<string, keyof Venta> = {
                      empresaNombre: 'empresaId',
                      origenNombre: 'origenId',
                      destinoNombre: 'destinoId',
                    }
                    const filterField = fieldMap[column.key]
                    const filterValue = originalRow[filterField]

                    cellContent = (
                      <span
                        className='cursor-pointer text-blue-600/80 hover:text-blue-700 hover:underline hover:font-medium transition-all'
                        onClick={() => onFilterClick?.(filterField, String(filterValue), String(rawValue || ''))}
                      >
                        {String(rawValue || '')}
                      </span>
                    )
                  } else {
                    cellContent = String(rawValue || '')
                  }

                  return (
                    <div
                      key={column.key}
                      className={`shrink-0 border-r border-gray-100 px-3 py-1 text-xs text-gray-900 ${
                        column.align === 'center'
                          ? 'flex items-center justify-center'
                          : alignClass[column.align]
                      }`}
                      style={{ width: column.width, minWidth: column.width }}
                      title={String(rawValue || '')}
                    >
                      {cellContent}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer sticky con totales */}
          <div className='sticky bottom-0 z-10 border-t-2 border-gray-300 bg-gray-100'>
            <div className='flex'>
              {columns.map((column, idx) => (
                <div
                  key={column.key}
                  className={`shrink-0 border-r border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-800 ${alignClass[column.align]}`}
                  style={{ width: column.width, minWidth: column.width }}
                >
                  {idx === 0
                    ? 'TOTALES'
                    : column.isSummable && totals[column.key] !== undefined
                      ? formatCurrency(totals[column.key])
                      : ''}
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// Componente para mostrar vista CSV
const CSVPreview = ({ data }: { data: unknown[] }) => {
  const csvContent = convertToCSV(data as PreviewData[])

  return (
    <div className='overflow-hidden rounded-lg border bg-white'>
      <div className='h-[500px] overflow-auto'>
        <pre className='p-4 font-mono text-xs whitespace-pre-wrap text-gray-900'>
          {csvContent}
        </pre>
      </div>
    </div>
  )
}

// Función para convertir ExportFilters a VentasSearchParams
const convertFiltersToSearchParams = (
  filters: ExportFilters
): VentasSearchParams => {
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
  if (filters.numeroTransaccion)
    searchParams.numeroTransaccion = filters.numeroTransaccion
  if (filters.nombreEmpresa) searchParams.nombreEmpresa = filters.nombreEmpresa
  if (filters.referenciaPago)
    searchParams.referenciaPago = filters.referenciaPago
  if (filters.bancardTransactionId)
    searchParams.bancardTransactionId = filters.bancardTransactionId

  // Mapear filtros de fecha
  if (filters.fechaVentaDesde)
    searchParams.fechaVentaDesde = filters.fechaVentaDesde
  if (filters.fechaVentaHasta)
    searchParams.fechaVentaHasta = filters.fechaVentaHasta
  if (filters.fechaViajeDesde)
    searchParams.fechaViajeDesde = filters.fechaViajeDesde
  if (filters.fechaViajeHasta)
    searchParams.fechaViajeHasta = filters.fechaViajeHasta

  // Mapear filtros de importe
  if (filters.importeMinimo) searchParams.importeMinimo = filters.importeMinimo
  if (filters.importeMaximo) searchParams.importeMaximo = filters.importeMaximo

  // Mapear ordenamiento
  if (filters.sortBy) searchParams.sortBy = filters.sortBy
  if (filters.sortOrder) searchParams.sortOrder = filters.sortOrder

  return searchParams
}

export function VentasPreviewTable({
  filters,
  isVisible,
  onFilterClick,
}: Readonly<VentasPreviewTableProps>) {
  const [isExpanded, setIsExpanded] = useState(true) // Mostrar automáticamente cuando hay datos

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'formato' || key === 'sortBy' || key === 'sortOrder') {
      return false
    }
    return value !== undefined && value !== null && value !== ''
  })

  // Convertir filtros a parámetros de búsqueda
  const searchParams = convertFiltersToSearchParams(filters)

  // Usar el hook de ventas para obtener los datos
  const {
    data: ventasResponse,
    isLoading,
    error,
    refetch,
  } = useVentasList(searchParams, {
    enabled: isVisible && hasActiveFilters,
  })

  const ventasData = ventasResponse?.data || []
  const totalCount = ventasResponse?.total || 0

  if (!isVisible) {
    return null
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-destructive flex items-center gap-2'>
            <AlertCircle className='h-5 w-5' />
            Error en Previsualización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : 'Error al cargar la previsualización'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => refetch()} variant='outline' className='mt-4'>
            <RefreshCw className='mr-2 h-4 w-4' />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!hasActiveFilters) {
    return (
      <Card>
        <CardContent>
          <ReadyToGenerateState description='Selecciona los filtros arriba y haz clic en "Aplicar filtro" para ver los datos antes de exportar.' />
        </CardContent>
      </Card>
    )
  }

  if (totalCount === 0) {
    return (
      <Card>
        <CardContent>
          <ReadyToGenerateState description='No encontramos datos con los filtros actuales. Ajusta los filtros y vuelve a aplicar para generar la previsualización.' />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Eye className='h-5 w-5' />
            Datos de Previsualización
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                const csvContent = convertToCSV(
                  ventasData as unknown as PreviewData[]
                )
                const blob = new Blob([csvContent], {
                  type: 'text/csv;charset=utf-8;',
                })
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
              <Download className='mr-2 h-4 w-4' />
              Descargar CSV
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                const excelBuffer = convertToExcel(
                  ventasData as unknown as PreviewData[]
                )
                const blob = new Blob([excelBuffer], {
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                })
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
              <Download className='mr-2 h-4 w-4' />
              Descargar Excel
            </Button>
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant='outline' size='sm'>
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
              <div className='flex items-center justify-center py-8'>
                <Loader2 className='mr-2 h-8 w-8 animate-spin' />
                <span>Cargando previsualización...</span>
              </div>
            ) : (
              <div className='space-y-4'>
                {/* Información de resumen */}
                <div className='bg-muted/50 grid grid-cols-1 gap-4 rounded-lg p-4 md:grid-cols-3'>
                  <div className='text-center'>
                    <div className='text-primary text-2xl font-bold'>
                      {totalCount.toLocaleString()}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Registros Totales
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-green-600'>
                      {formatCurrency(
                        ventasData.reduce(
                          (sum, item) => sum + item.importeTotal,
                          0
                        )
                      )}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Total Muestra
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {ventasData.length}
                    </div>
                    <div className='text-muted-foreground text-sm'>
                      Mostrando
                    </div>
                  </div>
                </div>

                {/* Vista de previsualización en formato tabla */}
                <Tabs defaultValue='excel' className='w-full'>
                  <TabsList className='grid w-full grid-cols-2'>
                    <TabsTrigger
                      value='excel'
                      className='flex items-center gap-2'
                    >
                      <FileSpreadsheet className='h-4 w-4' />
                      Vista Excel
                    </TabsTrigger>
                    <TabsTrigger
                      value='csv'
                      className='flex items-center gap-2'
                    >
                      <FileText className='h-4 w-4' />
                      Vista CSV
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value='excel' className='mt-4'>
                    <ExcelPreviewTable 
                      data={ventasData} 
                      onFilterClick={onFilterClick}
                    />
                  </TabsContent>

                  <TabsContent value='csv' className='mt-4'>
                    <CSVPreview data={ventasData} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
