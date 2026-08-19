import * as XLSX from 'xlsx'
import type { PreviewData } from '../services/preview.service'

// Función para convertir datos a CSV
export const convertToCSV = (data: PreviewData[]): string => {
  if (!data || data.length === 0) return ''

  // Obtener todas las claves únicas de todos los objetos
  const allKeys = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => allKeys.add(key))
    // También incluir campos anidados del cliente
    if (item.cliente && typeof item.cliente === 'object') {
      Object.keys(item.cliente).forEach((key) => allKeys.add(`cliente.${key}`))
    }
  })

  const headers = Array.from(allKeys).sort()

  // Crear filas CSV
  const csvRows = []

  // Agregar encabezados
  csvRows.push(headers.join(','))

  // Agregar datos
  data.forEach((item) => {
    const row: string[] = []
    headers.forEach((header) => {
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
      if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n')
      ) {
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
  const flattenedData = data.map((item) => {
    // Validar que item existe
    if (!item) {
      return {
        id: '',
        numeroTransaccion: '',
        empresaNombre: 'N/A',
        // ... todos los campos con valores por defecto
      }
    }

    return {
      // Se omite 'id' intencionalmente (no relevante para el usuario final)
      numeroTransaccion: item.numeroTransaccion || '',
      estadoPago: item.estadoPago || '',
      estadoVenta: item.estadoVenta || '',
      empresaNombre: item.empresaNombre || '',
      empresaId: item.empresaId || '',
      usuarioId: item.usuarioId || null,
      empresaBoleto: item.empresaBoleto || '',
      calidad: item.calidad || '',
      fechaVenta: item.fechaVenta || '',
      fechaViaje: item.fechaViaje || '',
      horaSalida: item.horaSalida || '',
      origenNombre: (item.origenNombre || '').replace(/ - Paraguay$/i, ''),
      destinoNombre: (item.destinoNombre || '').replace(/ - Paraguay$/i, ''),
      origenId: item.origenId || '',
      destinoId: item.destinoId || '',
      servicioId: item.servicioId || '',
      asientosOriginales: item.asientosOriginales?.join(', ') || 'N/A',
      importeTotal: item.importeTotal ?? 0,
      comisionTotal: item.comisionTotal ?? 0,
      serviceChargeNombreSnapshot: item.serviceChargeNombreSnapshot || null,
      serviceChargeTipoSnapshot: item.serviceChargeTipoSnapshot || null,
      serviceChargeMontoTotal: item.serviceChargeMontoTotal ?? 0,
      metodoPago: item.metodoPago || '',
      estadoAsientos: item.estadoAsientos || '',
      fechaExpiracionPago: item.fechaExpiracionPago || null,
      referenciaPago: item.referenciaPago || null,
      bancardTransactionId: item.bancardTransactionId || '',
      observaciones: item.observaciones || '',
      createdAt: item.createdAt || '',
      updatedAt: item.updatedAt || '',
      clienteNombre: item.cliente?.nombre || 'N/A',
      clienteApellido: item.cliente?.apellido || 'N/A',
      clienteTelefono: item.cliente?.telefono || 'N/A',
      clienteEmail: item.cliente?.email || 'N/A',
      clienteNacionalidad: item.cliente?.nacionalidad || 'N/A',
      clienteTipoDocumento: item.cliente?.tipoDocumento || 'N/A',
      clienteNumeroDocumento: item.cliente?.numeroDocumento || 'N/A',
      totalBoletos: item.totalBoletos ?? 0,
      numerosBoleto: item.numerosBoleto || '',
    }
  })

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

export type ColumnAlign = 'left' | 'right' | 'center'

export interface TableColumn {
  key: string
  header: string
  width: number
  align: ColumnAlign
  // Columnas que suman en el footer de totales
  isSummable?: boolean
}

// Función para obtener columnas de la tabla
export const getTableColumns = (): TableColumn[] => {
  return [
    // Columnas de identificación y estado (mayor prioridad visual)
    {
      key: 'numeroTransaccion',
      header: 'Transacción',
      width: 160,
      align: 'left',
    },
    { key: 'estadoPago', header: 'Estado Pago', width: 110, align: 'center' },
    { key: 'estadoVenta', header: 'Estado Venta', width: 110, align: 'center' },
    // Entidades
    { key: 'clienteNombre', header: 'Cliente', width: 180, align: 'left' },
    { key: 'empresaNombre', header: 'Empresa', width: 140, align: 'left' },
    // Ruta
    { key: 'origenNombre', header: 'Origen', width: 150, align: 'left' },
    { key: 'destinoNombre', header: 'Destino', width: 150, align: 'left' },
    // Fechas y hora
    { key: 'fechaVenta', header: 'Fecha Venta', width: 110, align: 'left' },
    { key: 'fechaViaje', header: 'Fecha Viaje', width: 110, align: 'left' },
    { key: 'horaSalida', header: 'Hora', width: 75, align: 'center' },
    // Valores numéricos alineados a la derecha
    {
      key: 'asientosOriginales',
      header: 'Asientos',
      width: 90,
      align: 'right',
    },
    {
      key: 'importeTotal',
      header: 'Importe',
      width: 120,
      align: 'right',
      isSummable: true,
    },
    {
      key: 'comisionTotal',
      header: 'Comisión',
      width: 110,
      align: 'right',
      isSummable: true,
    },
    { key: 'totalBoletos', header: 'Boletos', width: 80, align: 'right' },
    // Datos de pago
    { key: 'metodoPago', header: 'Método Pago', width: 110, align: 'left' },
    {
      key: 'estadoAsientos',
      header: 'Est. Asientos',
      width: 120,
      align: 'center',
    },
    { key: 'referenciaPago', header: 'Referencia', width: 130, align: 'left' },
    {
      key: 'bancardTransactionId',
      header: 'ID Bancard',
      width: 130,
      align: 'left',
    },
    // Datos adicionales
    { key: 'clienteEmail', header: 'Email', width: 180, align: 'left' },
    { key: 'clienteTelefono', header: 'Teléfono', width: 110, align: 'right' },
    { key: 'numerosBoleto', header: 'Núm. Boleto', width: 160, align: 'left' },
    {
      key: 'observaciones',
      header: 'Observaciones',
      width: 200,
      align: 'left',
    },
    { key: 'createdAt', header: 'Creado', width: 110, align: 'left' },
  ]
}

const stripParaguay = (value: string) =>
  value.replace(/ - Paraguay$/i, '').trim()

// Función para aplanar datos para la tabla
export const flattenDataForTable = (data: PreviewData[]) => {
  return data.map((item) => ({
    // 'id' omitido: no aporta valor al administrador en la vista de tabla
    numeroTransaccion: item?.numeroTransaccion || '',
    estadoPago: item?.estadoPago || '',
    estadoVenta: item?.estadoVenta || '',
    clienteNombre:
      item?.cliente?.nombre || item?.cliente?.apellido
        ? `${item.cliente?.nombre || ''} ${item.cliente?.apellido || ''}`.trim() ||
          'N/A'
        : 'N/A',
    empresaNombre: item?.empresaNombre || '',
    origenNombre: stripParaguay(item?.origenNombre || ''),
    destinoNombre: stripParaguay(item?.destinoNombre || ''),
    fechaVenta: item?.fechaVenta || '',
    fechaViaje: item?.fechaViaje || '',
    horaSalida: item?.horaSalida || '',
    asientosOriginales: item?.asientosOriginales?.join(', ') || 'N/A',
    importeTotal: item?.importeTotal || 0,
    comisionTotal: item?.comisionTotal || 0,
    totalBoletos: item?.totalBoletos || 0,
    metodoPago: item?.metodoPago || '',
    estadoAsientos: item?.estadoAsientos || '',
    referenciaPago: item?.referenciaPago || '',
    bancardTransactionId: item?.bancardTransactionId || '',
    clienteEmail: item?.cliente?.email || 'N/A',
    clienteTelefono: item?.cliente?.telefono || 'N/A',
    numerosBoleto: item?.numerosBoleto || '',
    observaciones: item?.observaciones || '',
    createdAt: item?.createdAt || '',
  }))
}
