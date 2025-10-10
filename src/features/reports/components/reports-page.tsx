import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconFileReport, IconDownload } from '@tabler/icons-react'
import { Filter, Eye, EyeOff } from 'lucide-react'
import { FiltersModal } from './filters-modal'
import { VentasPreviewTable } from './ventas-preview-table'
import { useExportReports } from '../hooks/use-export-reports'
import type { ExportFilters } from '../models/reports.model'

export function ReportsPage() {
  const [filters, setFilters] = useState<ExportFilters>({
    formato: 'xlsx',
    sortBy: 'fechaVenta',
    sortOrder: 'DESC',
  })
  
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  
  const { exportReports, isExporting } = useExportReports()

  const handleExport = () => {
    exportReports(filters)
  }

  const handleApplyFilters = () => {
    // Los filtros ya se aplicaron en el modal
    // Aquí podríamos agregar lógica adicional si es necesario
  }

  const togglePreview = () => {
    setShowPreview(!showPreview)
  }

  // Contar filtros activos (excluyendo configuración por defecto)
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'formato' || key === 'sortBy' || key === 'sortOrder') {
      return false
    }
    return value !== undefined && value !== null && value !== ''
  }).length

  const hasActiveFilters = activeFiltersCount > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconFileReport className="h-5 w-5" />
            Exportar Reportes de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Generar Reporte de Ventas</h3>
              <p className="text-muted-foreground mb-4">
                Configura los filtros deseados, previsualiza los datos y exporta los reportes de ventas 
                en formato Excel (XLSX) o CSV. Puedes filtrar por estado de pago, fechas, importes, empresas y más.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconDownload className="h-4 w-4" />
                <span>El archivo se descargará automáticamente</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Configuración de Exportación
            </div>
            {hasActiveFilters && (
              <Badge variant="secondary">
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowFiltersModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Configurar Filtros
            </Button>

            <Button
              onClick={togglePreview}
              variant="outline"
              disabled={!hasActiveFilters}
              className="flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Ocultar' : 'Previsualizar'} Datos
            </Button>

            <Button
              onClick={handleExport}
              disabled={isExporting || !hasActiveFilters}
              className="flex items-center gap-2"
            >
              <IconDownload className="h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar Reporte'}
            </Button>
          </div>

          {/* Información de filtros activos */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                <strong>Filtros aplicados:</strong> {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''}
                {filters.formato && (
                  <span className="ml-2">
                    • Formato: <Badge variant="outline" className="ml-1">{filters.formato.toUpperCase()}</Badge>
                  </span>
                )}
                {filters.sortBy && (
                  <span className="ml-2">
                    • Ordenado por: <Badge variant="outline" className="ml-1">{filters.sortBy}</Badge>
                  </span>
                )}
              </div>
            </div>
          )}

          {!hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700">
                <strong>💡 Tip:</strong> Configura los filtros para ver una previsualización de los datos antes de exportar.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Previsualización de Datos */}
      <VentasPreviewTable
        filters={filters}
        isVisible={showPreview}
        onToggleVisibility={togglePreview}
      />

      {/* Modal de Filtros */}
      <FiltersModal
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        isOpen={showFiltersModal}
        onOpenChange={setShowFiltersModal}
      />

      {/* Información Adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del Reporte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-1">Formato Excel (XLSX)</h4>
              <p className="text-muted-foreground">
                Ideal para análisis detallados con fórmulas y gráficos. Incluye formato y estilos.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Formato CSV</h4>
              <p className="text-muted-foreground">
                Formato simple y compatible con cualquier herramienta de análisis de datos.
              </p>
            </div>
          </div>
          <div className="pt-2 border-t">
            <h4 className="font-medium mb-1">Datos Incluidos</h4>
            <p className="text-muted-foreground">
              El reporte incluye información completa de las ventas: datos del cliente, 
              empresa, origen/destino, fechas, importes, estados de pago y asientos, 
              métodos de pago, y referencias de transacciones.
            </p>
          </div>
          <div className="pt-2 border-t">
            <h4 className="font-medium mb-1">Previsualización</h4>
            <p className="text-muted-foreground">
              Utiliza la función de previsualización para ver exactamente los datos que se exportarán 
              antes de generar el archivo. Esto te ayuda a verificar que los filtros estén configurados correctamente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
