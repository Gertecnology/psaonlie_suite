import type { ServiceCharge } from '../models/sales.model'

/**
 * Serialización del cargo por servicio en la URL.
 *
 * El flujo por URL (`/sales/seats` → `/sales/checkout` → `/sales/payment`)
 * pasaba el cargo como un único parámetro `serviceCharge` con el porcentaje.
 * Eso no puede representar un cargo FIJO: para esas empresas la pantalla
 * mostraba 0 y el backend cobraba el monto igual. Acá viajan los campos que
 * hacen falta para calcularlo bien.
 */
const CLAVES = {
  id: 'scId',
  nombre: 'scNombre',
  tipo: 'scTipo',
  porcentaje: 'scPorcentaje',
  montoFijo: 'scMontoFijo',
  montoMinimo: 'scMontoMinimo',
  montoMaximo: 'scMontoMaximo',
} as const

export function serializarServiceCharge(
  params: URLSearchParams,
  serviceCharge?: ServiceCharge | null,
): void {
  if (!serviceCharge || !serviceCharge.activo) return

  params.set(CLAVES.id, serviceCharge.id ?? '')
  params.set(CLAVES.nombre, serviceCharge.nombre ?? '')
  params.set(CLAVES.tipo, serviceCharge.tipoAplicacion ?? '')
  params.set(CLAVES.porcentaje, String(serviceCharge.porcentaje ?? ''))

  if (serviceCharge.montoFijo != null) {
    params.set(CLAVES.montoFijo, String(serviceCharge.montoFijo))
  }
  if (serviceCharge.montoMinimo != null) {
    params.set(CLAVES.montoMinimo, String(serviceCharge.montoMinimo))
  }
  if (serviceCharge.montoMaximo != null) {
    params.set(CLAVES.montoMaximo, String(serviceCharge.montoMaximo))
  }
}

export function deserializarServiceCharge(
  params: URLSearchParams,
): ServiceCharge | undefined {
  const tipo = params.get(CLAVES.tipo)
  if (!tipo) return undefined

  return {
    id: params.get(CLAVES.id) ?? '',
    nombre: params.get(CLAVES.nombre) ?? 'Cargo por servicio',
    tipoAplicacion: tipo,
    porcentaje: params.get(CLAVES.porcentaje) ?? '0',
    montoFijo: params.get(CLAVES.montoFijo),
    montoMinimo: params.get(CLAVES.montoMinimo),
    montoMaximo: params.get(CLAVES.montoMaximo),
    activo: true,
    esGlobal: false,
  }
}
