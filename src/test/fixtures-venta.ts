import type {
  Asiento,
  RoundTripSearchData,
  ServiceCharge,
  Servicio,
} from '@/features/sales/models/sales.model'

export const SERVICE_CHARGE_PORCENTUAL: ServiceCharge = {
  id: 'sc-1',
  nombre: 'Cargo por servicio',
  porcentaje: '10.00',
  activo: true,
  esGlobal: false,
  tipoAplicacion: 'PORCENTUAL',
  montoFijo: null,
}

export const SERVICIO: Servicio = {
  diffgr_id: 'd1',
  rowOrder: '0',
  Id: 'SRV-1',
  Emp: 'SOL',
  Cod: '001',
  Embarque: '08:00',
  Libres: '20',
  Calidad: 'CA',
  Tarifa: '150000',
  Desembarque: '14:00',
  fechaembarque: '2026-09-01',
  Fec: '2026-09-01',
  TextoTarifas: '',
  TextoTarifasFull: '',
}

export const ASIENTO_5: Asiento = {
  numero: '5',
  disponible: true,
  precio: 150000,
  tipo: 'VENTANA',
  piso: 1,
  calidad: 'Cama',
}

export const ASIENTO_6: Asiento = {
  numero: '6',
  disponible: true,
  precio: 150000,
  tipo: 'PASILLO',
  piso: 1,
  calidad: 'Cama',
}

export const RESPUESTA_ASIENTOS = {
  asientos: [ASIENTO_5, ASIENTO_6],
  totalDisponibles: 2,
  configuracionBus: { filas: 1, columnas: 2, pisos: 1 },
  servicioInfo: {
    empresa: 'Empresa Sol',
    calidadA: 'CA',
    calidadB: '',
    calidadDescripcionA: 'Cama',
    calidadDescripcionB: '',
    tarifaA: 150000,
    tarifaB: 0,
    tarifaAMn: 150000,
    tarifaBMn: 0,
    parados: 0,
    paradosVendidos: 0,
  },
}

/** Estado del flujo con el servicio de ida ya elegido, antes de bloquear. */
export function datosConServicioElegido(): RoundTripSearchData {
  return {
    ida: {
      origen: { id: 'ORI-1', nombre: 'Asunción' },
      destino: { id: 'DES-1', nombre: 'Ciudad del Este' },
      fecha: new Date('2026-09-01T00:00:00.000Z'),
      servicio: SERVICIO,
      empresaId: 'EMP-1',
      serviceCharge: SERVICE_CHARGE_PORCENTUAL,
    },
  }
}

/** Estado del flujo con los asientos ya bloqueados, listo para el checkout. */
export function datosConAsientosBloqueados(): RoundTripSearchData {
  const base = datosConServicioElegido()
  return {
    ida: {
      ...base.ida,
      asientos: [ASIENTO_5],
      codigoReferencia: 'REF-OK',
      bloqueoExpiraEn: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  }
}

export const CLIENTE_CREADO = {
  cliente: {
    id: 'CLI-1',
    email: 'pasajero@test.com',
    apellido: 'Pérez',
    nombre: 'Ana',
    nombreCompleto: 'Ana Pérez',
    createdAt: '2026-08-21T10:00:00.000Z',
    updatedAt: '2026-08-21T10:00:00.000Z',
  },
  clienteEmpresa: null,
  sincronizado: true,
}

export const VENTA_CONFIRMADA_OK = {
  esVentaIndividual: false,
  totalProcesadas: 1,
  exitosas: 1,
  fallidas: 0,
  tiempoProcesamiento: 150,
  resultados: [
    {
      indice: 0,
      exitoso: true,
      venta: {
        ventaId: 'V-1',
        numeroTransaccion: 'TXN-1',
        numeroBoleto: 'B-1',
        estado: 'RESERVADO',
        mensaje: 'Venta confirmada',
        fechaCreacion: '2026-08-21T10:00:00.000Z',
        boletos: [],
        comisionTotal: 15000,
      },
    },
  ],
}
