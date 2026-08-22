import { aFecha, aNumero } from '@/lib/formato'
import { apiFetch } from '@/utils/api-client'
import {
  HORAS_ALERTA_VENCIMIENTO,
  HORAS_SIN_SINCRONIZAR,
  type ConectividadEmpresas,
  type EmpresaConectividad,
  type PagoPorVencer,
  type PagosPorVencer,
  type VentaSinBoleto,
  type VentasSinBoleto,
} from '../models/alertas.model'
import type { MetodoPago } from '../models/ventas.model'
import { obtenerAgencias } from './agencias-panel.service'
import { obtenerVentas } from './ventas.service'

/**
 * Cuántas ventas pagadas se revisan para detectar las que no tienen boleto.
 *
 * El backend no tiene un endpoint de sólo lectura para esto (ver
 * `alertas.model.ts`), así que se analiza una ventana de las más recientes. 500
 * cubre con holgura el volumen actual; el panel dice explícitamente cuántas
 * revisó cuando hay más.
 */
export const VENTANA_VENTAS_SIN_BOLETO = 500

/**
 * Ventas cobradas al cliente que nunca generaron un boleto.
 *
 * Una venta con `estadoPago = PAGADO` y `totalBoletos === 0` es plata que entró
 * sin que el pasajero recibiera nada. Según el análisis del flujo de dinero, la
 * causa estructural es que el flujo de venta no es atómico: entre el cobro y la
 * emisión hay una llamada SOAP a la empresa que puede fallar y deja la venta a
 * mitad de camino.
 */
export async function obtenerVentasSinBoleto(
  filtrosFecha: { fechaVentaDesde?: string; fechaVentaHasta?: string } = {}
): Promise<VentasSinBoleto> {
  const respuesta = await obtenerVentas({
    ...filtrosFecha,
    estadoPago: 'PAGADO',
    limit: VENTANA_VENTAS_SIN_BOLETO,
    sortBy: 'fechaVenta',
    sortOrder: 'DESC',
  })

  const sinBoleto = respuesta.data.filter((venta) => venta.totalBoletos === 0)

  const detalle: VentaSinBoleto[] = sinBoleto.map((venta) => ({
    id: venta.id,
    numeroTransaccion: venta.numeroTransaccion,
    empresaNombre: venta.empresaNombre,
    fechaVenta: venta.fechaVenta,
    fechaViaje: venta.fechaViaje,
    metodoPago: venta.metodoPago,
    cobradoAlCliente: venta.importeTotal + venta.serviceChargeMontoTotal,
    cliente: nombreDeCliente(venta.cliente, venta.datosContacto),
  }))

  return {
    cantidad: detalle.length,
    montoAfectado: detalle.reduce((acc, v) => acc + v.cobradoAlCliente, 0),
    analizadas: respuesta.data.length,
    totalPagadas: respuesta.total,
    parcial: respuesta.total > respuesta.data.length,
    detalle,
  }
}

function nombreDeCliente(
  cliente: { nombre?: string; apellido?: string } | undefined,
  contacto: Record<string, unknown> | undefined
): string {
  const completo = [cliente?.nombre, cliente?.apellido]
    .filter((p): p is string => typeof p === 'string' && p.trim().length > 0)
    .join(' ')
  if (completo) return completo

  const deContacto = contacto?.nombre
  if (typeof deContacto === 'string' && deContacto.trim())
    return deContacto.trim()

  return 'Sin datos'
}

// ─── Pagos por vencer ───────────────────────────────────────────────────────

/** Fila cruda de `GET /api/admin/ventas/pagos-pendientes`. */
interface PagoPendienteCrudo {
  ventaId?: string
  numeroTransaccion?: string
  metodoPago?: string
  importeTotal?: unknown
  fechaVenta?: string
  fechaExpiracion?: string | null
  empresa?: { nombre?: string }
  ruta?: { origen?: string; destino?: string }
  cliente?: { nombre?: string }
  comprobante?: unknown
  tiempoRestante?: string
}

function horasHasta(fecha: string | null, ahora: Date): number | null {
  const objetivo = aFecha(fecha)
  if (!objetivo) return null
  return (objetivo.getTime() - ahora.getTime()) / (1000 * 60 * 60)
}

function normalizarPagoPendiente(
  fila: PagoPendienteCrudo,
  ahora: Date
): PagoPorVencer {
  const fechaExpiracion = fila.fechaExpiracion ?? null
  return {
    ventaId: String(fila.ventaId ?? ''),
    numeroTransaccion: String(fila.numeroTransaccion ?? ''),
    metodoPago: (fila.metodoPago ?? 'TRANSFERENCIA') as MetodoPago,
    // Este DTO NO pasa por `parseFloat` en el backend: llega como "150000.00".
    importeTotal: aNumero(fila.importeTotal),
    fechaVenta: String(fila.fechaVenta ?? ''),
    fechaExpiracion,
    empresa: fila.empresa?.nombre ?? 'N/A',
    origen: fila.ruta?.origen ?? 'N/A',
    destino: fila.ruta?.destino ?? 'N/A',
    cliente: fila.cliente?.nombre ?? 'Sin datos',
    tiempoRestante: fila.tiempoRestante ?? 'Sin vencimiento',
    horasRestantes: horasHasta(fechaExpiracion, ahora),
    tieneComprobante: Boolean(fila.comprobante),
  }
}

/**
 * Pagos pendientes que vencen pronto o ya vencieron.
 *
 * Fuente: `GET /api/admin/ventas/pagos-pendientes`. Dos límites del contrato
 * que hay que tener presentes al leer el número:
 * - La consulta del backend está acotada a `WHATSAPP` y `TRANSFERENCIA`. Las
 *   reservas por Bancard con pago pendiente **no aparecen acá**.
 * - `estadisticas.expirados` viene siempre en 0 (está hardcodeado), así que los
 *   vencidos se cuentan comparando `fechaExpiracion` del lado del panel.
 */
export async function obtenerPagosPorVencer(
  opciones: {
    horasAlerta?: number
    limite?: number
    ahora?: Date
  } = {}
): Promise<PagosPorVencer> {
  const {
    horasAlerta = HORAS_ALERTA_VENCIMIENTO,
    limite = 100,
    ahora = new Date(),
  } = opciones

  const query = new URLSearchParams({
    estadoPago: 'PENDIENTE',
    page: '1',
    limit: String(limite),
  })

  const crudo = await apiFetch<{ data?: unknown[]; total?: unknown }>(
    `/api/admin/ventas/pagos-pendientes?${query.toString()}`,
    { fallbackMessage: 'No se pudieron obtener los pagos pendientes.' }
  )

  const filas = Array.isArray(crudo?.data) ? crudo.data : []
  const pagos = filas
    .filter((f): f is PagoPendienteCrudo => typeof f === 'object' && f !== null)
    .map((fila) => normalizarPagoPendiente(fila, ahora))

  const vencidos = pagos.filter(
    (p) => p.horasRestantes !== null && p.horasRestantes <= 0
  )
  const porVencer = pagos
    .filter(
      (p) =>
        p.horasRestantes !== null &&
        p.horasRestantes > 0 &&
        p.horasRestantes <= horasAlerta
    )
    .sort((a, b) => (a.horasRestantes ?? 0) - (b.horasRestantes ?? 0))

  return {
    porVencer,
    vencidos,
    totalPendientes: aNumero(crudo?.total),
    montoPorVencer: porVencer.reduce((acc, p) => acc + p.importeTotal, 0),
  }
}

// ─── Conectividad de las empresas ───────────────────────────────────────────

/**
 * Estado de la conexión con el web server de cada empresa.
 *
 * Se apoya en `url` y `ultimaSincronizacionSoap`, NO en `activo`. El porqué
 * está documentado en `alertas.model.ts`: `activo` lo escriben el cron y los
 * operadores indistintamente, así que no distingue una caída de una baja
 * manual, y se revierte solo cada 3 minutos.
 */
export async function obtenerConectividadEmpresas(
  opciones: { horasSinSincronizar?: number; ahora?: Date } = {}
): Promise<ConectividadEmpresas> {
  const { horasSinSincronizar = HORAS_SIN_SINCRONIZAR, ahora = new Date() } =
    opciones

  const empresas = await obtenerAgencias()

  const evaluadas: EmpresaConectividad[] = empresas.map((empresa) => {
    const ultima = aFecha(empresa.ultimaSincronizacionSoap)
    const horas =
      ultima === null
        ? null
        : (ahora.getTime() - ultima.getTime()) / (1000 * 60 * 60)

    let situacion: EmpresaConectividad['situacion']
    if (empresa.url === null) {
      situacion = 'sin-url'
    } else if (horas === null) {
      situacion = 'sin-sincronizar'
    } else if (horas > horasSinSincronizar) {
      situacion = 'desactualizada'
    } else {
      situacion = 'ok'
    }

    return {
      id: empresa.id,
      nombre: empresa.nombre,
      url: empresa.url,
      activo: empresa.activo,
      ultimaSincronizacion: empresa.ultimaSincronizacionSoap,
      horasSinSincronizar: horas,
      situacion,
    }
  })

  const contar = (situacion: EmpresaConectividad['situacion']) =>
    evaluadas.filter((e) => e.situacion === situacion).length

  return {
    empresas: evaluadas,
    sinUrl: contar('sin-url'),
    sinSincronizar: contar('sin-sincronizar'),
    desactualizadas: contar('desactualizada'),
    total: evaluadas.length,
  }
}
