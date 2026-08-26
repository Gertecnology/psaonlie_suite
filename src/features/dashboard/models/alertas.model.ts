import type { MetodoPago } from './ventas.model'

/**
 * Alertas operativas del panel.
 *
 * Son lo primero que se ve porque son lo único que exige una acción hoy. El
 * resto del panel informa; esto interrumpe.
 */

export type SeveridadAlerta = 'critica' | 'seria' | 'atencion' | 'ok'

/** Una alerta ya resuelta y lista para renderizar. */
export interface Alerta {
  id: string
  severidad: SeveridadAlerta
  titulo: string
  /** Cantidad afectada. `null` cuando el dato no se pudo determinar. */
  cantidad: number | null
  /** Monto involucrado, cuando lo hay. */
  monto?: number
  /** Qué significa y qué hacer. Nunca "algo salió mal". */
  detalle: string
  /** Ruta del panel donde se resuelve, si existe. */
  accion?: { etiqueta: string; a: string; search?: Record<string, string> }
}

// ─── Ventas pagadas sin boleto ──────────────────────────────────────────────

/**
 * El caso más grave: el cliente pagó y nunca recibió el boleto.
 *
 * El backend no expone un endpoint de sólo lectura para esto — la única ruta
 * que lo calcula es `POST /api/admin/jobs/ejecutar/reconciliar-ventas-sin-boleto`,
 * que además **ejecuta** la reconciliación (manda notificaciones). Un panel no
 * puede disparar efectos secundarios al cargarse, así que esto se deriva del
 * listado: ventas con `estadoPago = PAGADO` y `totalBoletos === 0`.
 *
 * PENDIENTE DE AJUSTE (backend): un `GET /api/admin/ventas/sin-boleto` que
 * devuelva el conteo y las filas sin ejecutar nada convertiría esto en una
 * consulta exacta y barata. Hoy se analiza una ventana de las ventas pagadas
 * más recientes; `analizadas` y `totalPagadas` dicen cuántas fueron.
 */
export interface VentasSinBoleto {
  /** Ventas pagadas con 0 boletos dentro de la ventana analizada. */
  cantidad: number
  /** Suma de lo cobrado al cliente en esas ventas. */
  montoAfectado: number
  /** Cuántas ventas pagadas se revisaron. */
  analizadas: number
  /** Cuántas ventas pagadas hay en total en el sistema. */
  totalPagadas: number
  /** `true` cuando hay más ventas pagadas que las analizadas. */
  parcial: boolean
  detalle: VentaSinBoleto[]
}

export interface VentaSinBoleto {
  id: string
  numeroTransaccion: string
  empresaNombre: string
  fechaVenta: string
  fechaViaje: string
  metodoPago: MetodoPago
  cobradoAlCliente: number
  cliente: string
}

// ─── Pagos por vencer ───────────────────────────────────────────────────────

/**
 * Reservas con el pago pendiente y la expiración encima.
 *
 * Fuente: `GET /api/admin/ventas/pagos-pendientes`. Ojo con dos cosas del
 * contrato real: la consulta está acotada a los métodos que confirma un
 * administrador a mano —`TRANSFERENCIA` y `WEPA`—, así que las ventas por
 * Bancard nunca aparecen acá, y `estadisticas.expirados` viene siempre en 0
 * porque está hardcodeado.
 */
export interface PagoPorVencer {
  ventaId: string
  numeroTransaccion: string
  metodoPago: MetodoPago
  importeTotal: number
  fechaVenta: string
  fechaExpiracion: string | null
  empresa: string
  origen: string
  destino: string
  cliente: string
  /** Texto que arma el backend: "3 hora(s) 20 min", "Expirado"... */
  tiempoRestante: string
  /** Horas hasta la expiración. `null` si la venta no tiene vencimiento. */
  horasRestantes: number | null
  tieneComprobante: boolean
}

export interface PagosPorVencer {
  /** Los que vencen dentro de la ventana de alerta. */
  porVencer: PagoPorVencer[]
  /** Los que ya vencieron y siguen pendientes. */
  vencidos: PagoPorVencer[]
  /** Total de pagos pendientes, venzan cuando venzan. */
  totalPendientes: number
  montoPorVencer: number
}

// ─── Conectividad de empresas ───────────────────────────────────────────────

/**
 * Estado de la conexión con el web server de cada empresa.
 *
 * IMPORTANTE — por qué esto NO se apoya en `activo`: ese campo lo escriben dos
 * autores distintos. El cron `empresa-status.task.ts` corre cada 3 minutos y lo
 * sobrescribe en las dos direcciones (lo pone en `false` si la URL está vacía,
 * si el guard SSRF la bloquea, si la respuesta no es 2xx, o ante cualquier
 * excepción; y lo devuelve a `true` con que responda 2xx), y un operador
 * también lo edita a mano desde el CRUD de empresas. O sea: `activo: false` no
 * distingue "el web server está caído" de "alguien la deshabilitó", y un cambio
 * manual se revierte solo en menos de 3 minutos.
 *
 * Por eso la alerta se construye con dos hechos que sí son inequívocos:
 * - `url` vacía → la empresa no tiene web server configurado. No es una caída,
 *   es un dato que falta. (Al 21/08/2026: 19 de 20 empresas están así.)
 * - `ultimaSincronizacionSoap` → la última vez que la empresa respondió de
 *   verdad. Es lo más cercano a un latido que persiste el backend.
 *
 * PENDIENTE DE AJUSTE (backend): una alerta honesta de salud necesita columnas
 * propias — `estado_web_server`, `ultimo_check`, `tiempo_respuesta_ms` — y
 * separar el flag operativo (`activo`, decisión humana) del diagnóstico
 * (resultado del chequeo). Hoy `responseTime` se calcula y sólo se loguea.
 */
export interface EmpresaConectividad {
  id: string
  nombre: string
  /** `null` cuando la empresa no tiene URL configurada. */
  url: string | null
  activo: boolean
  ultimaSincronizacion: string | null
  /** Horas desde la última sincronización. `null` si nunca sincronizó. */
  horasSinSincronizar: number | null
  situacion: 'sin-url' | 'sin-sincronizar' | 'desactualizada' | 'ok'
}

export interface ConectividadEmpresas {
  empresas: EmpresaConectividad[]
  sinUrl: number
  sinSincronizar: number
  desactualizadas: number
  total: number
}

// ─── Agregado ───────────────────────────────────────────────────────────────

export interface ResumenAlertas {
  ventasSinBoleto: VentasSinBoleto
  pagosPorVencer: PagosPorVencer
  conectividad: ConectividadEmpresas
}

/** Horas de anticipación con las que se avisa de un pago por vencer. */
export const HORAS_ALERTA_VENCIMIENTO = 24

/** Horas sin sincronizar a partir de las cuales una empresa se marca. */
export const HORAS_SIN_SINCRONIZAR = 24
