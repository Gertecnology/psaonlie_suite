import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSalesStatistics } from '../hooks/use-sales-statistics'
import { StatisticsSearchParams } from '../models/statistics.model'
import { Download, Calculator } from 'lucide-react'
import { toast } from 'sonner'

interface LiquidationReportProps {
  onDownload?: () => void
}

export function LiquidationReport({ onDownload }: LiquidationReportProps) {
  const [dateRange, setDateRange] = useState<'currentMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'lastYear'>('currentMonth')
  const [groupBy, setGroupBy] = useState<string>('dia')
  const [empresaId, setEmpresaId] = useState<string>('all')

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

  // Parámetros para las estadísticas
  const statisticsParams: StatisticsSearchParams = {
    fechaDesde: startDate,
    fechaHasta: endDate,
    empresaId: empresaId && empresaId !== 'all' ? empresaId : undefined,
    agruparPor: groupBy
  }

  const { data: statistics, isLoading } = useSalesStatistics(statisticsParams)

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const getGroupByLabel = () => {
    switch (groupBy) {
      case 'dia':
        return 'Diaria'
      case 'semana':
        return 'Semanal'
      case 'mes':
        return 'Mensual'
      default:
        return 'Diaria'
    }
  }

  const handleDownload = () => {
    if (!statistics) {
      toast.error('No hay datos para generar el reporte')
      return
    }

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Liquidación - ${getDateRangeLabel()}</title>
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
            .section-title { font-size: 16px; font-weight: bold; margin: 24px 0 12px 0; color: #333; }
            .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
            .summary-item { padding: 12px; border: 1px solid #ddd; border-radius: 4px; text-align: center; }
            .summary-value { font-size: 18px; font-weight: bold; color: #2563eb; }
            .summary-label { font-size: 12px; color: #666; margin-top: 4px; }
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
              <div class="report-title">REPORTE DE LIQUIDACIÓN</div>
              <div class="report-subtitle">Agrupación: ${getGroupByLabel()}</div>
              <div class="report-subtitle">${getDateRangeSubtitle()}</div>
            </div>
            <div class="report-info">
              <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-PY', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
              <div><strong>Transacción:</strong> TXN${Date.now().toString().slice(-8)}</div>
            </div>
          </div>

          <!-- Resumen General -->
          <div class="section-title">RESUMEN GENERAL</div>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${statistics.generales.totalVentas}</div>
              <div class="summary-label">Total Ventas</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(statistics.generales.montoTotal)}</div>
              <div class="summary-label">Monto Total</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(statistics.generales.totalComisiones)}</div>
              <div class="summary-label">Total Comisiones</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(statistics.generales.totalServiceCharges)}</div>
              <div class="summary-label">Service Charges</div>
            </div>
          </div>

          <!-- Liquidación por Empresa -->
          ${statistics.porEmpresa.length > 0 ? `
            <div class="section-title">LIQUIDACIÓN POR EMPRESA</div>
            <table>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th style="text-align: right;">Ventas</th>
                  <th style="text-align: right;">Monto</th>
                  <th style="text-align: right;">Comisiones</th>
                  <th style="text-align: right;">Service Charges</th>
                  <th style="text-align: right;">%</th>
                </tr>
              </thead>
              <tbody>
                ${statistics.porEmpresa.map(empresa => `
                  <tr>
                    <td>${empresa.empresaNombre}</td>
                    <td style="text-align: right;">${empresa.cantidad}</td>
                    <td style="text-align: right;">${formatCurrency(empresa.montoPagado)}</td>
                    <td style="text-align: right;">${formatCurrency(empresa.comisiones)}</td>
                    <td style="text-align: right;">${formatCurrency(empresa.serviceCharges)}</td>
                    <td style="text-align: right;">${formatPercentage(empresa.porcentaje)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <!-- Liquidación por Método de Pago -->
          ${statistics.porMetodoPago.length > 0 ? `
            <div class="section-title">LIQUIDACIÓN POR MÉTODO DE PAGO</div>
            <table>
              <thead>
                <tr>
                  <th>Método de Pago</th>
                  <th style="text-align: right;">Cantidad</th>
                  <th style="text-align: right;">Monto</th>
                  <th style="text-align: right;">%</th>
                </tr>
              </thead>
              <tbody>
                ${statistics.porMetodoPago.map(metodo => `
                  <tr>
                    <td>${metodo.metodoPago}</td>
                    <td style="text-align: right;">${metodo.cantidad}</td>
                    <td style="text-align: right;">${formatCurrency(metodo.monto)}</td>
                    <td style="text-align: right;">${formatPercentage(metodo.porcentaje)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <!-- Evolución Temporal -->
          ${statistics.temporales.length > 0 ? `
            <div class="section-title">EVOLUCIÓN TEMPORAL (${getGroupByLabel()})</div>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th style="text-align: right;">Ventas</th>
                  <th style="text-align: right;">Monto</th>
                  <th style="text-align: right;">Completadas</th>
                  <th style="text-align: right;">Service Charges</th>
                </tr>
              </thead>
              <tbody>
                ${statistics.temporales.map(temporal => `
                  <tr>
                    <td>${temporal.fecha}</td>
                    <td style="text-align: right;">${temporal.ventas}</td>
                    <td style="text-align: right;">${formatCurrency(temporal.monto)}</td>
                    <td style="text-align: right;">${temporal.ventasCompletadas}</td>
                    <td style="text-align: right;">${formatCurrency(temporal.serviceChargesTotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
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
      
      // Esperar un momento para que se cargue el contenido y luego imprimir
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
    
    onDownload?.()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Reporte de Liquidación
          </CardTitle>
          <CardDescription>
            Genera un reporte de liquidación con comisiones y service charges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {/* Selector de Agrupación */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Agrupar por</label>
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Día</SelectItem>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Empresa */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Empresa (opcional)</label>
            <Select value={empresaId} onValueChange={setEmpresaId}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las empresas</SelectItem>
                {statistics?.porEmpresa.map((empresa) => (
                  <SelectItem key={empresa.empresaId} value={empresa.empresaId}>
                    {empresa.empresaNombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botón de descarga */}
          <div className="flex justify-end">
            <Button 
              onClick={handleDownload}
              disabled={!statistics || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
