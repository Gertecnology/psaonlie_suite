import { formatearGuaranies as formatearMoneda } from '@/lib/formato'
import type { ServiceCharge } from '../models/sales.model'

/**
 * Aritmética de dinero para la venta manual.
 *
 * El guaraní no tiene decimales: todo monto que se muestre o se envíe al
 * backend es un entero. Los importes que llegan de la API pueden venir como
 * string (las columnas `decimal` de Postgres se serializan como `"5.00"`), así
 * que todo entra por `aEnteroGuaranies` antes de sumarse. Concatenar un string
 * a un número — `150000 + "10000.00"` — es un error real que este módulo evita.
 */

/**
 * Normaliza cualquier valor de dinero de la API a un entero de guaraníes.
 * Devuelve 0 para `null`, `undefined`, vacío o texto no numérico.
 */
export function aEnteroGuaranies(valor: unknown): number {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? Math.round(valor) : 0
  }

  if (typeof valor === 'string') {
    const parseado = Number(valor.trim())
    return Number.isFinite(parseado) ? Math.round(parseado) : 0
  }

  return 0
}

/**
 * Formatea un monto en guaraníes, sin decimales.
 *
 * Delega en `@/lib/formato`, que es el único lugar donde se decide cómo se
 * escribe la plata en todo el panel. Acá sólo se agrega la normalización a
 * entero, que es lo propio de la venta manual.
 */
export function formatearGuaranies(monto: unknown): string {
  return formatearMoneda(aEnteroGuaranies(monto))
}

/** Suma los precios de una lista de asientos como enteros. */
export function sumarPreciosAsientos(
  asientos: ReadonlyArray<{ precio: unknown }>,
): number {
  return asientos.reduce(
    (total, asiento) => total + aEnteroGuaranies(asiento.precio),
    0,
  )
}

/**
 * Calcula el cargo por servicio replicando exactamente la fórmula del backend
 * (`VentaService.calcularServiceChargeTotal`): PORCENTUAL sobre el importe o
 * FIJO, acotado por monto mínimo y máximo cuando están definidos.
 *
 * Los valores válidos de `tipoAplicacion` son 'PORCENTUAL' y 'FIJO'. El panel
 * comparaba antes contra 'MONTO_FIJO' y 'PORCENTAJE', que no existen en el
 * backend: el cargo fijo se mostraba siempre como 0 mientras al cliente se le
 * cobraba el monto real.
 */
export function calcularCargoServicio(
  subtotal: number,
  serviceCharge?: ServiceCharge | null,
): number {
  if (!serviceCharge || !serviceCharge.activo) return 0

  const base = aEnteroGuaranies(subtotal)
  let monto = 0

  if (serviceCharge.tipoAplicacion === 'FIJO') {
    monto = aEnteroGuaranies(serviceCharge.montoFijo)
  } else if (serviceCharge.tipoAplicacion === 'PORCENTUAL') {
    const porcentaje = Number(serviceCharge.porcentaje)
    monto = Number.isFinite(porcentaje) ? Math.round((base * porcentaje) / 100) : 0
  }

  const minimo = aEnteroGuaranies(serviceCharge.montoMinimo)
  if (minimo > 0 && monto < minimo) {
    monto = minimo
  }

  const maximo = aEnteroGuaranies(serviceCharge.montoMaximo)
  if (maximo > 0 && monto > maximo) {
    monto = maximo
  }

  return monto
}

/** Etiqueta del cargo por servicio para mostrarle al operador y al cliente. */
export function describirCargoServicio(
  serviceCharge?: ServiceCharge | null,
): string {
  if (!serviceCharge) return 'Cargo por servicio'

  const nombre = serviceCharge.nombre || 'Cargo por servicio'

  if (serviceCharge.tipoAplicacion === 'PORCENTUAL') {
    const porcentaje = Number(serviceCharge.porcentaje)
    if (Number.isFinite(porcentaje) && porcentaje > 0) {
      return `${nombre} (${porcentaje}%)`
    }
  }

  return nombre
}

/**
 * Desglose de lo que paga el cliente.
 *
 * La comisión NO aparece acá a propósito: es un acuerdo entre nosotros y la
 * empresa, no se le muestra ni se le cobra al cliente. Lo que el cliente paga
 * es `importePasajes + cargoServicio`, que es exactamente lo que el backend
 * cobra por Bancard (`importeTotal + serviceChargeMontoTotal`).
 */
export interface DesglosePago {
  /** Suma de los pasajes: es el `importeTotal` que recibe la empresa. */
  importePasajes: number
  /** Cargo por servicio que se le suma al cliente. */
  cargoServicio: number
  /** Lo que efectivamente paga el cliente. */
  total: number
}

/** Construye el desglose de un tramo a partir de sus asientos. */
export function calcularDesglose(
  asientos: ReadonlyArray<{ precio: unknown }>,
  serviceCharge?: ServiceCharge | null,
): DesglosePago {
  const importePasajes = sumarPreciosAsientos(asientos)
  const cargoServicio = calcularCargoServicio(importePasajes, serviceCharge)

  return {
    importePasajes,
    cargoServicio,
    total: importePasajes + cargoServicio,
  }
}

/** Suma varios desgloses (ida + vuelta) en uno solo. */
export function sumarDesgloses(
  ...desgloses: ReadonlyArray<DesglosePago>
): DesglosePago {
  return desgloses.reduce<DesglosePago>(
    (acumulado, desglose) => ({
      importePasajes: acumulado.importePasajes + desglose.importePasajes,
      cargoServicio: acumulado.cargoServicio + desglose.cargoServicio,
      total: acumulado.total + desglose.total,
    }),
    { importePasajes: 0, cargoServicio: 0, total: 0 },
  )
}
