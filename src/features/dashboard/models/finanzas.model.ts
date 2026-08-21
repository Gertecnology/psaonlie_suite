import { aNumero } from '@/lib/formato'
import type {
  EstadisticasGenerales,
  EstadisticasPorEmpresa,
} from './estadisticas.model'

/**
 * El desglose del dinero de una venta.
 *
 * Reglas de negocio confirmadas el 21/08/2026
 * (`DISENO-Kardex-Movimientos-y-Facturacion-2026-08-21.md`):
 *
 * 1. El cliente paga **pasaje + cargo por servicio** en un solo cobro con
 *    tarjeta. La comisión NO se le cobra al cliente.
 * 2. La **empresa** factura el pasaje. **Nosotros** facturamos el cargo por
 *    servicio. Son dos comprobantes de dos emisores distintos.
 * 3. La **comisión se descuenta** de lo que se le transfiere a la empresa: se
 *    le rinde el pasaje menos la comisión. Nunca se le factura aparte.
 *
 * De ahí salen las dos igualdades que el panel muestra explícitamente:
 *
 *     cobradoAlCliente = pasaje + cargoServicio
 *     cobradoAlCliente = netoAEmpresas + comision + cargoServicio
 *                      = netoAEmpresas + ingresoPasajeOnline
 *
 * Estos tres montos NUNCA se suman como si fueran lo mismo. Un total que
 * sume pasaje + comisión + cargo por servicio cuenta la comisión dos veces,
 * porque ya está adentro del pasaje.
 */
export interface DesgloseDinero {
  /** `importeTotal`: lo que vale el pasaje. Lo factura la empresa. */
  pasaje: number
  /** `serviceChargeMontoTotal`: nuestro cargo, adicional al pasaje. */
  cargoServicio: number
  /** `comisionTotal`: nuestra comisión, descontada del pasaje. */
  comision: number
  /** Lo que efectivamente se le cobró al cliente. */
  cobradoAlCliente: number
  /** Nuestro ingreso bruto: cargo por servicio + comisión. */
  ingresoPasajeOnline: number
  /** Lo que hay que transferirle a las empresas: pasaje − comisión. */
  netoAEmpresas: number
}

/** Los tres montos crudos que vienen del backend. */
export interface MontosCrudos {
  pasaje: unknown
  cargoServicio: unknown
  comision: unknown
}

/**
 * Deriva el desglose completo a partir de los tres montos que guarda la venta.
 *
 * Acepta `unknown` a propósito: los campos `decimal` de Postgres llegan a veces
 * como `string` ("150000.00") y a veces como `number`, según qué mapper del
 * backend los tocó.
 */
export function calcularDesglose(montos: MontosCrudos): DesgloseDinero {
  const pasaje = aNumero(montos.pasaje)
  const cargoServicio = aNumero(montos.cargoServicio)
  const comision = aNumero(montos.comision)

  return {
    pasaje,
    cargoServicio,
    comision,
    cobradoAlCliente: pasaje + cargoServicio,
    ingresoPasajeOnline: cargoServicio + comision,
    netoAEmpresas: pasaje - comision,
  }
}

const DESGLOSE_VACIO: DesgloseDinero = {
  pasaje: 0,
  cargoServicio: 0,
  comision: 0,
  cobradoAlCliente: 0,
  ingresoPasajeOnline: 0,
  netoAEmpresas: 0,
}

/** Desglose vacío, para estados de carga y períodos sin ventas. */
export function desgloseVacio(): DesgloseDinero {
  return { ...DESGLOSE_VACIO }
}

/**
 * Desglose de lo efectivamente **cobrado** en el período.
 *
 * Es la cifra que encabeza el panel: plata que entró, no plata prometida. Las
 * ventas pendientes se muestran aparte para que nadie las lea como ingreso.
 */
export function desgloseCobrado(
  generales: EstadisticasGenerales | undefined
): DesgloseDinero {
  if (!generales) return desgloseVacio()
  return calcularDesglose({
    pasaje: generales.montoCompletado,
    cargoServicio: generales.serviceChargesPagados,
    comision: generales.comisionesPagadas,
  })
}

/** Desglose de lo que está pendiente de cobro. */
export function desglosePendiente(
  generales: EstadisticasGenerales | undefined
): DesgloseDinero {
  if (!generales) return desgloseVacio()
  return calcularDesglose({
    pasaje: generales.montoPendiente,
    cargoServicio: generales.serviceChargesPendientes,
    comision: generales.comisionesPendientes,
  })
}

/** Desglose de todo lo vendido, cobrado o no. */
export function desgloseTotal(
  generales: EstadisticasGenerales | undefined
): DesgloseDinero {
  if (!generales) return desgloseVacio()
  return calcularDesglose({
    pasaje: generales.montoTotal,
    cargoServicio: generales.totalServiceCharges,
    comision: generales.totalComisiones,
  })
}

/** Desglose de lo cobrado a una empresa concreta. */
export function desgloseEmpresaCobrado(
  empresa: EstadisticasPorEmpresa
): DesgloseDinero {
  return calcularDesglose({
    pasaje: empresa.montoPagado,
    cargoServicio: empresa.serviceChargesPagados,
    comision: empresa.comisionesPagadas,
  })
}

/** Suma varios desgloses respetando las reglas (no suma totales derivados). */
export function sumarDesgloses(
  desgloses: readonly DesgloseDinero[]
): DesgloseDinero {
  const acumulado = desgloses.reduce(
    (acc, d) => ({
      pasaje: acc.pasaje + d.pasaje,
      cargoServicio: acc.cargoServicio + d.cargoServicio,
      comision: acc.comision + d.comision,
    }),
    { pasaje: 0, cargoServicio: 0, comision: 0 }
  )
  return calcularDesglose(acumulado)
}

/** Resultado de verificar que las dos igualdades del desglose se cumplan. */
export interface Cuadre {
  cuadra: boolean
  /** `cobradoAlCliente − (pasaje + cargoServicio)`. */
  diferenciaCobro: number
  /** `cobradoAlCliente − (netoAEmpresas + ingresoPasajeOnline)`. */
  diferenciaReparto: number
}

/**
 * Verifica las dos identidades del desglose.
 *
 * Se usa en el informe de conciliación: si el reparto no cierra, el problema
 * está en los datos —no en la pantalla— y hay que decirlo, no maquillarlo.
 *
 * La tolerancia de 1 guaraní absorbe el redondeo de los `decimal(10,2)` del
 * backend, que guarda centavos en una moneda que no los tiene.
 */
export function verificarCuadre(
  desglose: DesgloseDinero,
  tolerancia = 1
): Cuadre {
  const diferenciaCobro =
    desglose.cobradoAlCliente - (desglose.pasaje + desglose.cargoServicio)
  const diferenciaReparto =
    desglose.cobradoAlCliente -
    (desglose.netoAEmpresas + desglose.ingresoPasajeOnline)

  return {
    cuadra:
      Math.abs(diferenciaCobro) <= tolerancia &&
      Math.abs(diferenciaReparto) <= tolerancia,
    diferenciaCobro,
    diferenciaReparto,
  }
}

/** Las cuatro partidas del desglose, listas para graficar o tabular. */
export interface PartidaDinero {
  clave: 'pasaje' | 'cargoServicio' | 'comision' | 'netoAEmpresas'
  etiqueta: string
  descripcion: string
  monto: number
}

/**
 * Composición de lo cobrado al cliente: pasaje + cargo por servicio.
 * Es la primera de las dos lecturas del mismo total.
 */
export function partidasCobro(desglose: DesgloseDinero): PartidaDinero[] {
  return [
    {
      clave: 'pasaje',
      etiqueta: 'Pasaje',
      descripcion: 'Lo factura la empresa de transporte',
      monto: desglose.pasaje,
    },
    {
      clave: 'cargoServicio',
      etiqueta: 'Cargo por servicio',
      descripcion: 'Lo facturamos nosotros',
      monto: desglose.cargoServicio,
    },
  ]
}

/**
 * Composición del reparto del mismo total: neto a las empresas + comisión +
 * cargo por servicio. Es la segunda lectura, y suma exactamente igual.
 */
export function partidasReparto(desglose: DesgloseDinero): PartidaDinero[] {
  return [
    {
      clave: 'netoAEmpresas',
      etiqueta: 'Neto a empresas',
      descripcion: 'Pasaje menos nuestra comisión',
      monto: desglose.netoAEmpresas,
    },
    {
      clave: 'comision',
      etiqueta: 'Comisión',
      descripcion: 'Se descuenta de lo que se le transfiere a la empresa',
      monto: desglose.comision,
    },
    {
      clave: 'cargoServicio',
      etiqueta: 'Cargo por servicio',
      descripcion: 'Lo facturamos nosotros',
      monto: desglose.cargoServicio,
    },
  ]
}
