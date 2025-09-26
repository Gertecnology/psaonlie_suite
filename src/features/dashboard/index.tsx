import { PageLayout } from '@/components/layout/page-layout'
import { useSalesStatistics } from './hooks/use-sales-statistics'
import { useClientesList } from './hooks/use-clientes-list'
import { VentasList } from './components/ventas-list'
import { SalesReport } from './components/sales-report'
import { CompanySalesReport } from './components/company-sales-report'
import { LiquidationReport } from './components/liquidation-report'
import { StatisticsSearchParams } from './models/statistics.model'
import { useVentasList } from './hooks/use-ventas-list'
import { VentasSearchParams } from './models/sales.model'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Building2, Calculator } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function Dashboard() {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [activeReportTab, setActiveReportTab] = useState('general')
  const [reportDateRange, setReportDateRange] = useState<{startDate: string, endDate: string}>({
    startDate: '',
    endDate: ''
  })
  
  // Example usage of the statistics hook
  const statisticsParams: StatisticsSearchParams = {
    // You can add date filters here
    // fechaDesde: '2025-01-01',
    // fechaHasta: '2025-12-31',
    // empresaId: 'specific-company-id',
    // agruparPor: 'dia' // or 'semana', 'mes'
  }

  // Parámetros para obtener las ventas para el reporte
  const ventasParams: VentasSearchParams = {
    page: 1,
    limit: 1000,
    sortBy: 'fechaVenta',
    sortOrder: 'DESC',
    fechaVentaDesde: reportDateRange.startDate || undefined,
    fechaVentaHasta: reportDateRange.endDate || undefined,
  }

  const { data: statistics, isLoading: statisticsLoading, error: statisticsError } = useSalesStatistics(statisticsParams)
  const { data: clients, isLoading: clientsLoading, error: clientsError } = useClientesList()
  const { data: ventasData} = useVentasList(ventasParams)

  const isLoading = statisticsLoading || clientsLoading
  const error = statisticsError || clientsError

  const handleDateRangeChange = useCallback((startDate: string, endDate: string) => {
    setReportDateRange({ startDate, endDate })
  }, [])

  return (
    <PageLayout
      title="Bienvenido a PasajeOnline"
      description="Panel de control principal del sistema"
      showSearch={true}
      actions={
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Reportes de Ventas
              </DialogTitle>
              <DialogDescription>
                Genera reportes de ventas generales o específicos por empresa
              </DialogDescription>
            </DialogHeader>
            <Tabs value={activeReportTab} onValueChange={setActiveReportTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general" className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4" />
                  Reporte General
                </TabsTrigger>
                <TabsTrigger value="company" className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4" />
                  Por Empresa
                </TabsTrigger>
                <TabsTrigger value="liquidation" className="flex items-center gap-2 text-sm">
                  <Calculator className="h-4 w-4" />
                  Liquidación
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="mt-4">
                <SalesReport 
                  data={ventasData?.data || []}
                  title="REPORTE DE VENTAS"
                  onDownload={() => setIsReportDialogOpen(false)}
                  onDateRangeChange={handleDateRangeChange}
                />
              </TabsContent>
              
              <TabsContent value="company" className="mt-4">
                <CompanySalesReport 
                  onDownload={() => setIsReportDialogOpen(false)}
                />
              </TabsContent>
              
              <TabsContent value="liquidation" className="mt-4">
                <LiquidationReport 
                  onDownload={() => setIsReportDialogOpen(false)}
                />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Statistics Cards */}
        {isLoading && (
          <div className="col-span-full text-center py-8">
            <p>Cargando estadísticas...</p>
          </div>
        )}

        {error && (
          <div className="col-span-full text-center py-8 text-red-600">
            <p>Error al cargar estadísticas: {error.message}</p>
          </div>
        )}

        {statistics && clients && (
          <>
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Total Ventas</h3>
              <p className="text-2xl font-bold">{statistics.generales.totalVentas}</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Total Clientes</h3>
              <p className="text-2xl font-bold">{clients.resumenGeneral.totalClientes}</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Total Comisiones</h3>
              <p className="text-2xl font-bold">Gs. {statistics.generales.totalComisiones.toLocaleString()}</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="font-semibold">Total Service Charges</h3>
              <p className="text-2xl font-bold">Gs. {statistics.generales.totalServiceCharges.toLocaleString()}</p>
            </div>
          </>
        )}
      </div>

      {/* Sales List */}
      <div className="mt-8">
        <VentasList />
      </div>
    </PageLayout>
  )
}

