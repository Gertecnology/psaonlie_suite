import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconFileReport, IconDownload } from '@tabler/icons-react'
import { ExportFiltersComponent } from './export-filters'
import { useExportReports } from '../hooks/use-export-reports'
import type { ExportFilters } from '../models/reports.model'

export function ReportsPage() {
  const [filters, setFilters] = useState<ExportFilters>({
    formato: 'xlsx',
    sortBy: 'fechaVenta',
    sortOrder: 'DESC',
  })
  
  const { exportReports, isExporting } = useExportReports()

  const handleExport = () => {
    exportReports(filters)
  }

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
                Selecciona los filtros deseados y exporta los datos de ventas en formato Excel (XLSX) o CSV. 
                Puedes filtrar por estado de pago, fechas, importes, empresas y más.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconDownload className="h-4 w-4" />
                <span>El archivo se descargará automáticamente</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros de Exportación */}
      <ExportFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        onExport={handleExport}
        isExporting={isExporting}
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
        </CardContent>
      </Card>
    </div>
  )
}
