import { PDFReport, usePDFReport } from '@/utils/pdf-report'
import { Button } from '@/components/ui/button'
import { Download, FileText } from 'lucide-react'
import { type Venta } from '../models/sales.model'

interface SalesReportProps {
  data: Venta[]
  title?: string
  subtitle?: string
  onDownload?: () => void
}

export function SalesReport({ 
  data, 
  title = "REPORTE DE VENTAS", 
  subtitle,
  onDownload 
}: SalesReportProps) {
  const { componentRef } = usePDFReport()

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

  const getEstadoPagoBadge = (estado: string) => {
    const variants = {
      PAGADO: 'bg-green-100 text-green-800',
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      EXPIRADO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
      FALLIDO: 'bg-red-100 text-red-800',
      REEMBOLSADO: 'bg-blue-100 text-blue-800',
    } as const

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${variants[estado as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}>
        {estado}
      </span>
    )
  }

  const getEstadoVentaBadge = (estado: string) => {
    const variants = {
      CONFIRMADO: 'bg-green-100 text-green-800',
      RESERVADO: 'bg-yellow-100 text-yellow-800',
      EXPIRADO: 'bg-red-100 text-red-800',
      CANCELADO: 'bg-gray-100 text-gray-800',
      ANULADO: 'bg-red-100 text-red-800',
      PENDIENTE_PAGO: 'bg-yellow-100 text-yellow-800',
      PAGO_APROBADO: 'bg-green-100 text-green-800',
    } as const

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${variants[estado as keyof typeof variants] || 'bg-gray-100 text-gray-800'}`}>
        {estado}
      </span>
    )
  }

  // Calcular totales
  const totalVentas = data.length
  const totalImporte = data.reduce((sum, venta) => sum + venta.importeTotal, 0)
  const ventasPagadas = data.filter(v => v.estadoPago === 'PAGADO').length
  const ventasPendientes = data.filter(v => v.estadoPago === 'PENDIENTE').length

  const columns = [
    {
      key: 'numeroTransaccion',
      label: 'Transacción',
      width: '120px',
      render: (value: unknown) => (
        <span className="font-mono text-xs">{String(value)}</span>
      )
    },
    {
      key: 'empresaNombre',
      label: 'Empresa',
      width: '150px',
      render: (value: unknown, row: unknown) => (
        <div>
          <div className="font-medium">{String(value)}</div>
          <div className="text-xs text-gray-600">{(row as Venta).empresaBoleto}</div>
        </div>
      )
    },
    {
      key: 'ruta',
      label: 'Ruta',
      width: '200px',
      render: (_value: unknown, row: unknown) => (
        <div>
          <div className="font-medium">{(row as Venta).origenNombre} → {(row as Venta).destinoNombre}</div>
          <div className="text-xs text-gray-600">{(row as Venta).servicioId}</div>
        </div>
      )
    },
    {
      key: 'fechaViaje',
      label: 'Fecha Viaje',
      width: '120px',
      render: (value: unknown) => formatDate(String(value))
    },
    {
      key: 'asientos',
      label: 'Asientos',
      width: '100px',
      render: (_value: unknown, row: unknown) => (
        <div className="flex flex-wrap gap-1">
          {(row as Venta).asientosOriginales.map((asiento: string, index: number) => (
            <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
              {asiento}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'importeTotal',
      label: 'Importe',
      width: '100px',
      render: (value: unknown) => (
        <span className="font-medium">{formatCurrency(Number(value))}</span>
      )
    },
    {
      key: 'metodoPago',
      label: 'Método Pago',
      width: '100px'
    },
    {
      key: 'estadoPago',
      label: 'Estado Pago',
      width: '100px',
      render: (value: unknown) => getEstadoPagoBadge(String(value))
    },
    {
      key: 'estadoVenta',
      label: 'Estado Venta',
      width: '100px',
      render: (value: unknown) => getEstadoVentaBadge(String(value))
    }
  ]

  const companyInfo = {
    name: 'PasajeOnline',
    ruc: 'RUC 80007518-8',
    phone: '(021) 728-3500',
    address: 'Sistema Integrado de Gestión de Boletos',
    timbrado: 'N/A'
  }

  const reportInfo = {
    reportNumber: `REP-${Date.now().toString().slice(-8)}`,
    date: new Date().toISOString(),
    transactionId: `TXN${Date.now().toString().slice(-8)}`
  }

  const summary = {
    total: totalImporte
  }

  const handleDownload = () => {
    // Crear una nueva ventana para la impresión
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Reporte de Ventas - ${currentMonth}</title>
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
              <div class="report-title">${title}</div>
              <div class="report-subtitle">${subtitle}</div>
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
              ${data.map(venta => `
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
      
      // Esperar un momento para que se cargue el contenido y luego imprimir
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
    
    onDownload?.()
  }

  // Obtener información del mes actual
  const currentMonth = new Date().toLocaleDateString('es-PY', { 
    month: 'long', 
    year: 'numeric' 
  })

  return (
    <div className="space-y-4">
      {/* Botón de descarga */}
      <div className="flex justify-end">
        <Button 
          onClick={handleDownload}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar PDF
        </Button>
      </div>

      {/* Componente de reporte (oculto visualmente pero disponible para impresión) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', visibility: 'hidden' }}>
        <PDFReport
          ref={componentRef}
          title={title}
          subtitle={subtitle}
          companyInfo={companyInfo}
          reportInfo={reportInfo}
          data={data}
          columns={columns}
          summary={summary}
          footer="PASAJE ONLINE - Sistema Integrado de Gestión de Boletos"
        />
      </div>

      {/* Vista previa del reporte */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Vista Previa del Reporte - {currentMonth}</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <div className="text-gray-600">Total Ventas</div>
            <div className="font-bold text-lg">{totalVentas}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-gray-600">Total Importe</div>
            <div className="font-bold text-lg">{formatCurrency(totalImporte)}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-gray-600">Ventas Pagadas</div>
            <div className="font-bold text-lg text-green-600">{ventasPagadas}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-gray-600">Ventas Pendientes</div>
            <div className="font-bold text-lg text-yellow-600">{ventasPendientes}</div>
          </div>
        </div>
        
        {totalVentas === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm">
              <strong>Nota:</strong> No se encontraron ventas para el mes de {currentMonth}.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
