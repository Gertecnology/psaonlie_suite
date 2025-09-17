import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Download, FileText, Building2 } from 'lucide-react'
import { useGetCompanies } from '@/features/companies/hooks/use-get-companies'
import { useVentasList } from '../hooks/use-ventas-list'
import { type VentasSearchParams } from '../models/sales.model'

interface CompanySalesReportProps {
  onDownload?: () => void
}

export function CompanySalesReport({ onDownload }: CompanySalesReportProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<'currentMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'lastYear'>('currentMonth')
  
  // Obtener todas las empresas
  const { data: companiesData, isLoading: companiesLoading } = useGetCompanies(1, 1000)
  
  // Función para obtener el último día del mes
  const getLastDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate()
  }

  // Función para obtener el mes anterior
  const getPreviousMonth = (year: number, month: number) => {
    if (month === 1) {
      return { year: year - 1, month: 12 }
    }
    return { year, month: month - 1 }
  }

  // Función para obtener la fecha actual en Paraguay
  const getCurrentDateInParaguay = () => {
    const now = new Date()
    // Paraguay está en UTC-3, pero vamos a usar la fecha local del navegador
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1, // getMonth() es 0-indexado
      day: now.getDate()
    }
  }
  
  // Calcular fechas según el rango seleccionado
  const getDateRange = () => {
    const { year: currentYear, month: currentMonth } = getCurrentDateInParaguay()
    
    switch (dateRange) {
      case 'currentMonth':
        return {
          startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          endDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${getLastDayOfMonth(currentYear, currentMonth)}`
        }
      case 'lastMonth': {
        const { year: lastMonthYear, month: lastMonth } = getPreviousMonth(currentYear, currentMonth)
        return {
          startDate: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`,
          endDate: `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-${getLastDayOfMonth(lastMonthYear, lastMonth)}`
        }
      }
      case 'last3Months': {
        const threeMonthsAgo = currentMonth <= 3 ? currentMonth + 9 : currentMonth - 3
        const threeMonthsAgoYear = currentMonth <= 3 ? currentYear - 1 : currentYear
        return {
          startDate: `${threeMonthsAgoYear}-${String(threeMonthsAgo).padStart(2, '0')}-01`,
          endDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${getLastDayOfMonth(currentYear, currentMonth)}`
        }
      }
      case 'last6Months': {
        const sixMonthsAgo = currentMonth <= 6 ? currentMonth + 6 : currentMonth - 6
        const sixMonthsAgoYear = currentMonth <= 6 ? currentYear - 1 : currentYear
        return {
          startDate: `${sixMonthsAgoYear}-${String(sixMonthsAgo).padStart(2, '0')}-01`,
          endDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${getLastDayOfMonth(currentYear, currentMonth)}`
        }
      }
      case 'lastYear':
        return {
          startDate: `${currentYear - 1}-${String(currentMonth).padStart(2, '0')}-01`,
          endDate: `${currentYear - 1}-${String(currentMonth).padStart(2, '0')}-${getLastDayOfMonth(currentYear - 1, currentMonth)}`
        }
      default:
        return {
          startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
          endDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-${getLastDayOfMonth(currentYear, currentMonth)}`
        }
    }
  }
  
  const { startDate, endDate } = getDateRange()
  
  // Parámetros para obtener ventas de la empresa seleccionada
  const ventasParams: VentasSearchParams = {
    page: 1,
    limit: 1000,
    sortBy: 'fechaVenta',
    sortOrder: 'DESC',
    empresaId: selectedCompanyId || undefined,
    fechaVentaDesde: startDate,
    fechaVentaHasta: endDate,
  }
  
  const { data: ventasData } = useVentasList(ventasParams)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PY', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'currentMonth':
        return 'Mes Actual'
      case 'lastMonth':
        return 'Mes Anterior'
      case 'last3Months':
        return 'Últimos 3 Meses'
      case 'last6Months':
        return 'Últimos 6 Meses'
      case 'lastYear':
        return 'Último Año'
      default:
        return 'Mes Actual'
    }
  }

  const getDateRangeSubtitle = () => {
    // Parsear las fechas correctamente para evitar problemas de zona horaria
    const startParts = startDate.split('-')
    const endParts = endDate.split('-')
    
    const startFormatted = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2])).toLocaleDateString('es-PY', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    const endFormatted = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2])).toLocaleDateString('es-PY', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    return `Del ${startFormatted} al ${endFormatted}`
  }

  // Calcular totales
  const totalVentas = ventasData?.data.length || 0
  const totalImporte = ventasData?.data.reduce((sum, venta) => sum + venta.importeTotal, 0) || 0

  const selectedCompany = companiesData?.items.find(c => c.id === selectedCompanyId)

  const handleDownload = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow && ventasData) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Ventas por Empresa - ${selectedCompany?.nombre || 'Todas las Empresas'}</title>
          <style>
            @page { size: A4; margin: 0.5in; }
            body { font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
            .company-info { font-size: 12px; }
            .logo { width: 80px; height: 80px; background: linear-gradient(45deg, #ef4444, #3b82f6); border-radius: 50%; }
            .report-title { font-size: 20px; font-weight: bold; }
            .report-subtitle { font-size: 12px; color: #666; }
            .report-info { text-align: right; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .summary { text-align: right; margin-bottom: 24px; }
            .total { font-size: 18px; font-weight: bold; text-decoration: underline; }
            .footer { border-top: 1px solid #000; padding-top: 16px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="company-name">PasajeOnline</div>
              <div class="company-info">
                RUC: RUC 80007518-8<br>
                Tel: (021) 728-3500<br>
                Sistema Integrado de Gestión de Boletos<br>
                Timbrado: N/A
              </div>
            </div>
            <div class="logo"></div>
          </div>
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
              <div class="report-title">REPORTE DE VENTAS POR EMPRESA</div>
              <div class="report-subtitle">${selectedCompany?.nombre ? `Empresa: ${selectedCompany.nombre}` : 'Todas las Empresas'}</div>
              <div class="report-subtitle">${getDateRangeSubtitle()}</div>
            </div>
            <div class="report-info">
              <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-PY', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
              <div><strong>Transacción:</strong> TXN${Date.now().toString().slice(-8)}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Transacción</th>
                <th>Empresa</th>
                <th>Ruta</th>
                <th>Fecha Viaje</th>
                <th>Asientos</th>
                <th>Importe</th>
                <th>Método Pago</th>
                <th>Estado Pago</th>
                <th>Estado Venta</th>
              </tr>
            </thead>
            <tbody>
              ${ventasData.data.map(venta => `
                <tr>
                  <td style="font-family: monospace; font-size: 12px;">${venta.numeroTransaccion}</td>
                  <td>
                    <div style="font-weight: bold;">${venta.empresaNombre}</div>
                    <div style="font-size: 12px; color: #666;">${venta.empresaBoleto}</div>
                  </td>
                  <td>
                    <div style="font-weight: bold;">${venta.origenNombre} → ${venta.destinoNombre}</div>
                    <div style="font-size: 12px; color: #666;">${venta.servicioId}</div>
                  </td>
                  <td>${formatDate(venta.fechaViaje)}</td>
                  <td>${venta.asientosOriginales.join(', ')}</td>
                  <td style="font-weight: bold;">${formatCurrency(venta.importeTotal)}</td>
                  <td>${venta.metodoPago}</td>
                  <td>${venta.estadoPago}</td>
                  <td>${venta.estadoVenta}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div style="width: 256px; margin-left: auto;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span>TOTAL:</span>
                <span class="total">${formatCurrency(totalImporte)}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <div>PASAJE ONLINE - Sistema Integrado de Gestión de Boletos</div>
            <div style="margin-top: 8px; font-size: 10px; color: #666;">
              Generado: ${new Date().toLocaleDateString('es-PY', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </body>
        </html>
      `
      
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
    
    onDownload?.()
  }

  const canGenerateReport = selectedCompanyId && ventasData && ventasData.data.length > 0

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Reporte de Ventas por Empresa
          </CardTitle>
          <CardDescription>
            Selecciona una empresa y genera un reporte detallado de sus ventas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de Empresa */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa</label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una empresa" />
              </SelectTrigger>
              <SelectContent>
                {companiesLoading ? (
                  <SelectItem value="loading" disabled>Cargando empresas...</SelectItem>
                ) : (
                  companiesData?.items.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Rango de Fechas */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Select value={dateRange} onValueChange={(value: 'currentMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'lastYear') => setDateRange(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="currentMonth">Mes Actual</SelectItem>
                <SelectItem value="lastMonth">Mes Anterior</SelectItem>
                <SelectItem value="last3Months">Últimos 3 Meses</SelectItem>
                <SelectItem value="last6Months">Últimos 6 Meses</SelectItem>
                <SelectItem value="lastYear">Último Año</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botón de Generar Reporte */}
          <div className="flex justify-end">
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!canGenerateReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Reporte
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Descargar Reporte
                  </DialogTitle>
                  <DialogDescription>
                    Genera y descarga el reporte de ventas para {selectedCompany?.nombre}
                  </DialogDescription>
                </DialogHeader>
                {ventasData && (
                  <div className="space-y-4">
                    {/* Información del reporte */}
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Empresa:</strong> {selectedCompany?.nombre}</p>
                      <p><strong>Período:</strong> {getDateRangeLabel()}</p>
                      <p><strong>Total Ventas:</strong> {totalVentas}</p>
                      <p><strong>Total Importe:</strong> {formatCurrency(totalImporte)}</p>
                    </div>

                    {/* Botón de descarga */}
                    <div className="flex justify-center">
                      <Button 
                        onClick={handleDownload}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>


                    {totalVentas === 0 && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                          <strong>Nota:</strong> No se encontraron ventas para {selectedCompany?.nombre} en el período seleccionado.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
