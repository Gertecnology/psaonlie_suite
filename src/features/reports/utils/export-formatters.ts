import * as XLSX from 'xlsx'
import type { PreviewData } from '../services/preview.service'

// Función para convertir datos a CSV
export const convertToCSV = (data: PreviewData[]): string => {
  if (!data || data.length === 0) return ''

  // Obtener todas las claves únicas de todos los objetos
  const allKeys = new Set<string>()
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key))
    // También incluir campos anidados del cliente
    if (item.cliente && typeof item.cliente === 'object') {
      Object.keys(item.cliente).forEach(key => allKeys.add(`cliente.${key}`))
    }
  })

  const headers = Array.from(allKeys).sort()

  // Crear filas CSV
  const csvRows = []

  // Agregar encabezados
  csvRows.push(headers.join(','))

  // Agregar datos
  data.forEach(item => {
    const row: string[] = []
    headers.forEach(header => {
      let value: unknown = ''
      
      if (header.startsWith('cliente.')) {
        const clientKey = header.replace('cliente.', '')
        value = item.cliente?.[clientKey as keyof typeof item.cliente] || ''
      } else {
        value = item[header as keyof PreviewData] || ''
      }

      // Convertir a string y escapar comillas
      const stringValue = String(value)
      
      // Escapar comillas y envolver en comillas si contiene comas o comillas
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        const escapedValue = `"${stringValue.replace(/"/g, '""')}"`
        row.push(escapedValue)
      } else {
        row.push(stringValue)
      }
    })
    csvRows.push(row.join(','))
  })

  return csvRows.join('\n')
}

// Función para convertir datos a Excel (XLSX)
export const convertToExcel = (data: PreviewData[]): ArrayBuffer => {
  if (!data || data.length === 0) {
    // Crear un archivo Excel vacío
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([['No hay datos para mostrar']])
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas')
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  }

  // Aplanar los datos para incluir campos del cliente
  const flattenedData = data.map(item => ({
    id: item.id,
    numeroTransaccion: item.numeroTransaccion,
    empresaId: item.empresaId,
    empresaNombre: item.empresaNombre,
    usuarioId: item.usuarioId,
    empresaBoleto: item.empresaBoleto,
    calidad: item.calidad,
    fechaVenta: item.fechaVenta,
    fechaViaje: item.fechaViaje,
    horaSalida: item.horaSalida,
    origenId: item.origenId,
    origenNombre: item.origenNombre,
    destinoId: item.destinoId,
    destinoNombre: item.destinoNombre,
    servicioId: item.servicioId,
    asientosOriginales: item.asientosOriginales?.join(', ') || 'N/A',
    importeTotal: item.importeTotal,
    comisionTotal: item.comisionTotal,
    serviceChargeIdSnapshot: item.serviceChargeIdSnapshot,
    serviceChargeNombreSnapshot: item.serviceChargeNombreSnapshot,
    serviceChargeTipoSnapshot: item.serviceChargeTipoSnapshot,
    serviceChargeMontoTotal: item.serviceChargeMontoTotal,
    metodoPago: item.metodoPago,
    estadoPago: item.estadoPago,
    estadoVenta: item.estadoVenta,
    estadoAsientos: item.estadoAsientos,
    fechaExpiracionPago: item.fechaExpiracionPago,
    referenciaPago: item.referenciaPago,
    bancardTransactionId: item.bancardTransactionId,
    observaciones: item.observaciones,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    // Campos del cliente con validación null/undefined
    clienteId: item.cliente?.id || 'N/A',
    clienteTipoDocumento: item.cliente?.tipoDocumento || 'N/A',
    clienteNumeroDocumento: item.cliente?.numeroDocumento || 'N/A',
    clienteNombre: item.cliente?.nombre || 'N/A',
    clienteApellido: item.cliente?.apellido || 'N/A',
    clienteTelefono: item.cliente?.telefono || 'N/A',
    clienteEmail: item.cliente?.email || 'N/A',
    clienteNacionalidad: item.cliente?.nacionalidad || 'N/A',
    totalBoletos: item.totalBoletos,
    numerosBoleto: item.numerosBoleto,
  }))

  // Crear hoja de cálculo
  const ws = XLSX.utils.json_to_sheet(flattenedData)
  
  // Configurar anchos de columna
  const colWidths = [
    { wch: 15 }, // id
    { wch: 20 }, // numeroTransaccion
    { wch: 15 }, // empresaId
    { wch: 20 }, // empresaNombre
    { wch: 15 }, // usuarioId
    { wch: 15 }, // clienteId
    { wch: 10 }, // empresaBoleto
    { wch: 10 }, // calidad
    { wch: 20 }, // fechaVenta
    { wch: 15 }, // fechaViaje
    { wch: 15 }, // horaSalida
    { wch: 15 }, // origenId
    { wch: 25 }, // origenNombre
    { wch: 15 }, // destinoId
    { wch: 25 }, // destinoNombre
    { wch: 15 }, // servicioId
    { wch: 20 }, // asientosOriginales
    { wch: 15 }, // importeTotal
    { wch: 15 }, // comisionTotal
    { wch: 20 }, // serviceChargeIdSnapshot
    { wch: 25 }, // serviceChargeNombreSnapshot
    { wch: 20 }, // serviceChargeTipoSnapshot
    { wch: 20 }, // serviceChargeMontoTotal
    { wch: 15 }, // metodoPago
    { wch: 15 }, // estadoPago
    { wch: 15 }, // estadoVenta
    { wch: 15 }, // estadoAsientos
    { wch: 20 }, // fechaExpiracionPago
    { wch: 20 }, // referenciaPago
    { wch: 20 }, // bancardTransactionId
    { wch: 30 }, // observaciones
    { wch: 20 }, // createdAt
    { wch: 20 }, // updatedAt
    { wch: 15 }, // clienteId
    { wch: 15 }, // clienteTipoDocumento
    { wch: 15 }, // clienteNumeroDocumento
    { wch: 20 }, // clienteNombre
    { wch: 20 }, // clienteApellido
    { wch: 15 }, // clienteTelefono
    { wch: 25 }, // clienteEmail
    { wch: 10 }, // clienteNacionalidad
    { wch: 10 }, // totalBoletos
    { wch: 30 }, // numerosBoleto
  ]
  
  ws['!cols'] = colWidths

  // Crear libro de trabajo
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas')

  // Convertir a ArrayBuffer
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
}

// Función para obtener columnas de la tabla
export const getTableColumns = () => {
  return [
    { key: 'numeroTransaccion', header: 'Transacción', width: 160 },
    { key: 'empresaNombre', header: 'Empresa', width: 140 },
    { key: 'clienteNombre', header: 'Cliente', width: 180 },
    { key: 'clienteEmail', header: 'Email', width: 180 },
    { key: 'clienteTelefono', header: 'Teléfono', width: 110 },
    { key: 'origenNombre', header: 'Origen', width: 180 },
    { key: 'destinoNombre', header: 'Destino', width: 180 },
    { key: 'fechaVenta', header: 'Fecha Venta', width: 130 },
    { key: 'fechaViaje', header: 'Fecha Viaje', width: 110 },
    { key: 'horaSalida', header: 'Hora', width: 80 },
    { key: 'asientosOriginales', header: 'Asientos', width: 90 },
    { key: 'importeTotal', header: 'Importe', width: 110 },
    { key: 'comisionTotal', header: 'Comisión', width: 90 },
    { key: 'metodoPago', header: 'Método', width: 100 },
    { key: 'estadoPago', header: 'Estado Pago', width: 110 },
    { key: 'estadoVenta', header: 'Estado Venta', width: 110 },
    { key: 'estadoAsientos', header: 'Estado Asientos', width: 120 },
    { key: 'bancardTransactionId', header: 'ID Bancard', width: 130 },
    { key: 'referenciaPago', header: 'Referencia', width: 130 },
    { key: 'totalBoletos', header: 'Boletos', width: 80 },
    { key: 'numerosBoleto', header: 'Números Boleto', width: 180 },
    { key: 'observaciones', header: 'Observaciones', width: 200 },
    { key: 'createdAt', header: 'Creado', width: 130 },
    { key: 'updatedAt', header: 'Actualizado', width: 130 },
  ]
}

// Función para aplanar datos para la tabla
export const flattenDataForTable = (data: PreviewData[]) => {
  return data.map(item => ({
    id: item.id,
    numeroTransaccion: item.numeroTransaccion,
    empresaNombre: item.empresaNombre,
    clienteNombre: item.cliente ? `${item.cliente.nombre || ''} ${item.cliente.apellido || ''}`.trim() : 'N/A',
    clienteEmail: item.cliente?.email || 'N/A',
    clienteTelefono: item.cliente?.telefono || 'N/A',
    origenNombre: item.origenNombre,
    destinoNombre: item.destinoNombre,
    fechaVenta: item.fechaVenta,
    fechaViaje: item.fechaViaje,
    horaSalida: item.horaSalida,
    asientosOriginales: item.asientosOriginales?.join(', ') || 'N/A',
    importeTotal: item.importeTotal,
    comisionTotal: item.comisionTotal,
    metodoPago: item.metodoPago,
    estadoPago: item.estadoPago,
    estadoVenta: item.estadoVenta,
    estadoAsientos: item.estadoAsientos,
    bancardTransactionId: item.bancardTransactionId,
    referenciaPago: item.referenciaPago,
    totalBoletos: item.totalBoletos,
    numerosBoleto: item.numerosBoleto,
    observaciones: item.observaciones,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }))
}
