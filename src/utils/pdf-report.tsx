import React, { forwardRef } from 'react'
import { useReactToPrint } from 'react-to-print'

export interface PDFReportProps {
  title: string
  subtitle?: string
  companyInfo: {
    name: string
    ruc?: string
    phone?: string
    address?: string
    timbrado?: string
  }
  reportInfo: {
    reportNumber: string
    date: string
    transactionId?: string
  }
  data: unknown[]
  columns: Array<{
    key: string
    label: string
    width?: string
    render?: (value: unknown, row: unknown) => React.ReactNode
  }>
  summary?: {
    subtotalExento?: number
    subtotalGravado?: number
    iva?: number
    total: number
  }
  footer?: string
  className?: string
}

export const PDFReport = forwardRef<HTMLDivElement, PDFReportProps>(
  ({ 
    title, 
    subtitle, 
    companyInfo, 
    reportInfo, 
    data, 
    columns, 
    summary, 
    footer,
    className = ""
  }, ref) => {
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

    return (
      <div 
        ref={ref} 
        className={`bg-white text-black p-8 max-w-4xl mx-auto font-sans ${className}`}
        style={{ 
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '1.4'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{companyInfo.name}</h1>
            <div className="text-sm space-y-1">
              {companyInfo.ruc && <p>RUC: {companyInfo.ruc}</p>}
              {companyInfo.phone && <p>Tel: {companyInfo.phone}</p>}
              {companyInfo.address && <p>{companyInfo.address}</p>}
              {companyInfo.timbrado && <p>Timbrado: {companyInfo.timbrado}</p>}
            </div>
          </div>
          
          {/* Logo placeholder */}
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-blue-500 rounded-full"></div>
          </div>
        </div>

        {/* Report Info */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
          </div>
          <div className="text-right text-sm">
            <p><strong>Fecha:</strong> {formatDate(reportInfo.date)}</p>
            {reportInfo.transactionId && (
              <p><strong>Transacción:</strong> {reportInfo.transactionId}</p>
            )}
          </div>
        </div>

        {/* Data Table */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                {columns.map((column) => (
                  <th 
                    key={column.key}
                    className="border border-gray-300 px-3 py-2 text-left font-semibold"
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => (
                    <td 
                      key={column.key}
                      className="border border-gray-300 px-3 py-2"
                    >
                      {column.render 
                        ? column.render((row as Record<string, unknown>)[column.key], row)
                        : String((row as Record<string, unknown>)[column.key] ?? '')
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                {summary.subtotalExento !== undefined && (
                  <div className="flex justify-between">
                    <span>Subtotal Exento:</span>
                    <span>{formatCurrency(summary.subtotalExento)}</span>
                  </div>
                )}
                {summary.subtotalGravado !== undefined && (
                  <div className="flex justify-between">
                    <span>Subtotal Gravado (10%):</span>
                    <span>{formatCurrency(summary.subtotalGravado)}</span>
                  </div>
                )}
                {summary.iva !== undefined && (
                  <div className="flex justify-between">
                    <span>IVA (10%):</span>
                    <span>{formatCurrency(summary.iva)}</span>
                  </div>
                )}
                <hr className="border-black" />
                <div className="flex justify-between text-lg font-bold">
                  <span>TOTAL:</span>
                  <span className="underline">{formatCurrency(summary.total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="mt-8 pt-4 border-t border-black text-center text-sm">
            <p>{footer}</p>
            <p className="mt-2 text-xs text-gray-600">
              Generado: {formatDate(new Date().toISOString())}
            </p>
          </div>
        )}
      </div>
    )
  }
)

PDFReport.displayName = 'PDFReport'

// Hook para usar el componente de reporte
// eslint-disable-next-line react-refresh/only-export-components
export const usePDFReport = () => {
  const componentRef = React.useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Reporte de Ventas',
    pageStyle: `
      @page {
        size: A4;
        margin: 0.5in;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .print-hidden {
          display: none !important;
        }
      }
    `
  })

  return {
    componentRef,
    handlePrint
  }
}
