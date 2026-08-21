import { describe, expect, it } from 'vitest'
import type { EstadisticasGenerales } from './estadisticas.model'
import {
  calcularDesglose,
  desgloseCobrado,
  desgloseEmpresaCobrado,
  desglosePendiente,
  desgloseTotal,
  partidasCobro,
  partidasReparto,
  sumarDesgloses,
  verificarCuadre,
} from './finanzas.model'

/**
 * Estos tests son el contrato del negocio escrito en código.
 *
 * Las reglas confirmadas el 21/08/2026:
 * 1. El cliente paga pasaje + cargo por servicio. La comisión no se le cobra.
 * 2. La empresa factura el pasaje; nosotros el cargo por servicio.
 * 3. La comisión se descuenta de lo que se le transfiere a la empresa.
 *
 * De ahí sale lo que este archivo defiende: los tres montos no se suman entre
 * sí. Un total que sume pasaje + comisión + cargo por servicio cuenta la
 * comisión dos veces, porque ya está adentro del pasaje.
 */

/** El ejemplo del diseño del kardex: pasaje 100.000, comisión 10%, cargo 5.000. */
const EJEMPLO = { pasaje: 100_000, cargoServicio: 5_000, comision: 10_000 }

describe('calcularDesglose', () => {
  it('el cliente paga el pasaje más el cargo por servicio', () => {
    const d = calcularDesglose(EJEMPLO)
    expect(d.cobradoAlCliente).toBe(105_000)
  })

  it('la comisión NO se le suma a lo que paga el cliente', () => {
    // Es el error más caro posible en esta pantalla: mostrar 115.000 cobrados
    // cuando por la tarjeta pasaron 105.000.
    const d = calcularDesglose(EJEMPLO)
    expect(d.cobradoAlCliente).not.toBe(115_000)
    expect(d.cobradoAlCliente).toBe(d.pasaje + d.cargoServicio)
  })

  it('nuestro ingreso es el cargo por servicio más la comisión', () => {
    const d = calcularDesglose(EJEMPLO)
    expect(d.ingresoPasajeOnline).toBe(15_000)
  })

  it('a la empresa le queda el pasaje menos la comisión', () => {
    const d = calcularDesglose(EJEMPLO)
    expect(d.netoAEmpresas).toBe(90_000)
  })

  it('lo cobrado se reparte exactamente entre la empresa y nosotros', () => {
    const d = calcularDesglose(EJEMPLO)
    expect(d.netoAEmpresas + d.ingresoPasajeOnline).toBe(d.cobradoAlCliente)
  })

  it('normaliza los importes que llegan como string', () => {
    // `decimal(10,2)` de Postgres: "100000.00". Con `+` sobre strings, la suma
    // concatena en vez de sumar.
    const d = calcularDesglose({
      pasaje: '100000.00',
      cargoServicio: '5000.00',
      comision: '10000.00',
    })
    expect(d.cobradoAlCliente).toBe(105_000)
    expect(d.netoAEmpresas).toBe(90_000)
  })

  it('no rompe con datos ausentes', () => {
    const d = calcularDesglose({
      pasaje: null,
      cargoServicio: undefined,
      comision: '',
    })
    expect(d.cobradoAlCliente).toBe(0)
    expect(d.netoAEmpresas).toBe(0)
    expect(d.ingresoPasajeOnline).toBe(0)
  })

  it('tolera una venta sin cargo por servicio ni comisión', () => {
    // Las "ventas simples" del backend guardan `comisionTotal: 0`.
    const d = calcularDesglose({
      pasaje: 80_000,
      cargoServicio: 0,
      comision: 0,
    })
    expect(d.cobradoAlCliente).toBe(80_000)
    expect(d.netoAEmpresas).toBe(80_000)
    expect(d.ingresoPasajeOnline).toBe(0)
  })
})

// Sólo los campos que consumen las funciones bajo prueba.
function generales(
  parcial: Partial<EstadisticasGenerales>
): EstadisticasGenerales {
  return {
    totalVentas: 0,
    ventasCompletadas: 0,
    ventasPendientes: 0,
    ventasCanceladas: 0,
    ventasExpiradas: 0,
    montoTotal: 0,
    montoCompletado: 0,
    montoPendiente: 0,
    totalComisiones: 0,
    comisionesPagadas: 0,
    comisionesPendientes: 0,
    totalServiceCharges: 0,
    serviceChargesPagados: 0,
    serviceChargesPendientes: 0,
    serviceChargePromedioPorVenta: 0,
    totalBoletos: 0,
    boletosPagados: 0,
    boletosPendientes: 0,
    tasaConversion: 0,
    montoPromedioPorVenta: 0,
    boletosPromedioPorVenta: 0,
    ...parcial,
  }
}

describe('desgloses derivados de las estadísticas', () => {
  const estadisticas = generales({
    montoTotal: 500_000,
    montoCompletado: 300_000,
    montoPendiente: 200_000,
    totalComisiones: 50_000,
    comisionesPagadas: 30_000,
    comisionesPendientes: 20_000,
    totalServiceCharges: 25_000,
    serviceChargesPagados: 15_000,
    serviceChargesPendientes: 10_000,
  })

  it('lo cobrado usa sólo las columnas de "pagado"', () => {
    // La cifra que encabeza el panel es plata que entró, no plata prometida.
    const d = desgloseCobrado(estadisticas)
    expect(d.pasaje).toBe(300_000)
    expect(d.cargoServicio).toBe(15_000)
    expect(d.comision).toBe(30_000)
    expect(d.cobradoAlCliente).toBe(315_000)
    expect(d.netoAEmpresas).toBe(270_000)
  })

  it('lo pendiente usa sólo las columnas de "pendiente"', () => {
    const d = desglosePendiente(estadisticas)
    expect(d.pasaje).toBe(200_000)
    expect(d.cobradoAlCliente).toBe(210_000)
  })

  it('cobrado más pendiente reconstruye el total', () => {
    const cobrado = desgloseCobrado(estadisticas)
    const pendiente = desglosePendiente(estadisticas)
    const total = desgloseTotal(estadisticas)

    expect(cobrado.pasaje + pendiente.pasaje).toBe(total.pasaje)
    expect(cobrado.comision + pendiente.comision).toBe(total.comision)
    expect(cobrado.cargoServicio + pendiente.cargoServicio).toBe(
      total.cargoServicio
    )
  })

  it('devuelve todo en cero cuando no hay estadísticas', () => {
    const d = desgloseCobrado(undefined)
    expect(d.cobradoAlCliente).toBe(0)
    expect(d.netoAEmpresas).toBe(0)
  })
})

describe('desgloseEmpresaCobrado', () => {
  it('usa las columnas de pagado de la empresa', () => {
    const d = desgloseEmpresaCobrado({
      empresaId: 'e1',
      empresaNombre: 'Canindeyú',
      cantidad: 10,
      monto: 200_000,
      montoPagado: 150_000,
      montoPendiente: 50_000,
      comisiones: 20_000,
      comisionesPagadas: 15_000,
      comisionesPendientes: 5_000,
      serviceCharges: 10_000,
      serviceChargesPagados: 7_500,
      serviceChargesPendientes: 2_500,
      porcentaje: 40,
    })

    expect(d.pasaje).toBe(150_000)
    expect(d.netoAEmpresas).toBe(135_000)
    expect(d.ingresoPasajeOnline).toBe(22_500)
  })
})

describe('sumarDesgloses', () => {
  it('suma las partidas base y recalcula los derivados', () => {
    // Sumar los derivados directamente sería sumar la comisión dos veces.
    const a = calcularDesglose({ pasaje: 100, cargoServicio: 10, comision: 5 })
    const b = calcularDesglose({ pasaje: 200, cargoServicio: 20, comision: 10 })
    const total = sumarDesgloses([a, b])

    expect(total.pasaje).toBe(300)
    expect(total.cargoServicio).toBe(30)
    expect(total.comision).toBe(15)
    expect(total.cobradoAlCliente).toBe(330)
    expect(total.netoAEmpresas).toBe(285)
  })

  it('la suma de partes cuadra igual que cada parte', () => {
    const partes = [
      calcularDesglose({ pasaje: 1_000, cargoServicio: 50, comision: 100 }),
      calcularDesglose({ pasaje: 2_500, cargoServicio: 125, comision: 250 }),
      calcularDesglose({ pasaje: 333, cargoServicio: 17, comision: 33 }),
    ]
    expect(verificarCuadre(sumarDesgloses(partes)).cuadra).toBe(true)
  })

  it('devuelve ceros con una lista vacía', () => {
    expect(sumarDesgloses([]).cobradoAlCliente).toBe(0)
  })
})

describe('verificarCuadre', () => {
  it('un desglose bien construido siempre cuadra', () => {
    expect(verificarCuadre(calcularDesglose(EJEMPLO)).cuadra).toBe(true)
  })

  it('detecta un desglose adulterado', () => {
    // Simula el dato roto que este control existe para encontrar.
    const roto = { ...calcularDesglose(EJEMPLO), cobradoAlCliente: 999_999 }
    const cuadre = verificarCuadre(roto)

    expect(cuadre.cuadra).toBe(false)
    expect(cuadre.diferenciaCobro).not.toBe(0)
  })

  it('tolera hasta un guaraní de redondeo', () => {
    // El backend guarda `decimal(10,2)` en una moneda sin centavos.
    const conCentavos = calcularDesglose({
      pasaje: 100_000.4,
      cargoServicio: 5_000.3,
      comision: 10_000.2,
    })
    expect(verificarCuadre(conCentavos).cuadra).toBe(true)
  })
})

describe('partidas para graficar', () => {
  it('las dos lecturas suman el mismo total', () => {
    // Es la razón de ser de la pantalla: las dos tiras tienen el mismo ancho.
    const d = calcularDesglose(EJEMPLO)
    const sumaCobro = partidasCobro(d).reduce((acc, p) => acc + p.monto, 0)
    const sumaReparto = partidasReparto(d).reduce((acc, p) => acc + p.monto, 0)

    expect(sumaCobro).toBe(d.cobradoAlCliente)
    expect(sumaReparto).toBe(d.cobradoAlCliente)
    expect(sumaCobro).toBe(sumaReparto)
  })

  it('cada partida se explica a sí misma', () => {
    const d = calcularDesglose(EJEMPLO)
    for (const partida of [...partidasCobro(d), ...partidasReparto(d)]) {
      expect(partida.etiqueta.length).toBeGreaterThan(0)
      expect(partida.descripcion.length).toBeGreaterThan(0)
    }
  })
})
