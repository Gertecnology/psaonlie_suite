import { describe, expect, it } from 'vitest'
import {
  aEnteroGuaranies,
  calcularCargoServicio,
  calcularDesglose,
  describirCargoServicio,
  formatearGuaranies,
  sumarDesgloses,
  sumarPreciosAsientos,
} from './money'
import type { ServiceCharge } from '../models/sales.model'

const cargoPorcentual: ServiceCharge = {
  id: 'sc-1',
  nombre: 'Cargo por servicio',
  porcentaje: '10.00',
  activo: true,
  esGlobal: false,
  tipoAplicacion: 'PORCENTUAL',
  montoFijo: null,
}

const cargoFijo: ServiceCharge = {
  id: 'sc-2',
  nombre: 'Cargo fijo',
  porcentaje: '0.00',
  activo: true,
  esGlobal: false,
  tipoAplicacion: 'FIJO',
  montoFijo: '15000.00',
}

describe('aEnteroGuaranies', () => {
  it('redondea a entero: el guaraní no tiene decimales', () => {
    expect(aEnteroGuaranies(150000.4)).toBe(150000)
    expect(aEnteroGuaranies(150000.6)).toBe(150001)
  })

  it('acepta los decimales que Postgres serializa como string', () => {
    expect(aEnteroGuaranies('15000.00')).toBe(15000)
    expect(aEnteroGuaranies('10.5')).toBe(11)
  })

  it('devuelve 0 para valores ausentes o no numéricos', () => {
    expect(aEnteroGuaranies(null)).toBe(0)
    expect(aEnteroGuaranies(undefined)).toBe(0)
    expect(aEnteroGuaranies('')).toBe(0)
    expect(aEnteroGuaranies('no es un número')).toBe(0)
    expect(aEnteroGuaranies(Number.NaN)).toBe(0)
  })
})

describe('sumarPreciosAsientos', () => {
  it('suma como números aunque los precios vengan como string', () => {
    expect(
      sumarPreciosAsientos([{ precio: '150000' }, { precio: 150000 }]),
    ).toBe(300000)
  })
})

describe('calcularCargoServicio', () => {
  it('aplica el porcentaje sobre el importe de los pasajes', () => {
    expect(calcularCargoServicio(150000, cargoPorcentual)).toBe(15000)
  })

  it('aplica el monto fijo cuando el tipo es FIJO', () => {
    // El panel comparaba contra 'MONTO_FIJO', que no existe en el backend:
    // mostraba 0 mientras al cliente se le cobraba el monto real.
    expect(calcularCargoServicio(150000, cargoFijo)).toBe(15000)
  })

  it('no cobra nada cuando el cargo está inactivo', () => {
    expect(
      calcularCargoServicio(150000, { ...cargoPorcentual, activo: false }),
    ).toBe(0)
  })

  it('no cobra nada cuando no hay cargo configurado', () => {
    expect(calcularCargoServicio(150000, undefined)).toBe(0)
    expect(calcularCargoServicio(150000, null)).toBe(0)
  })

  it('respeta el monto mínimo y el máximo', () => {
    const conMinimo: ServiceCharge = { ...cargoPorcentual, montoMinimo: '20000' }
    expect(calcularCargoServicio(150000, conMinimo)).toBe(20000)

    const conMaximo: ServiceCharge = { ...cargoPorcentual, montoMaximo: '5000' }
    expect(calcularCargoServicio(150000, conMaximo)).toBe(5000)
  })

  it('devuelve un entero, nunca decimales', () => {
    const cargoRaro: ServiceCharge = { ...cargoPorcentual, porcentaje: '7.5' }
    const resultado = calcularCargoServicio(133333, cargoRaro)
    expect(Number.isInteger(resultado)).toBe(true)
    expect(resultado).toBe(10000)
  })
})

describe('calcularDesglose', () => {
  it('separa pasajes, cargo por servicio y total', () => {
    const desglose = calcularDesglose(
      [{ precio: 150000 }, { precio: 150000 }],
      cargoPorcentual,
    )

    expect(desglose).toEqual({
      importePasajes: 300000,
      cargoServicio: 30000,
      total: 330000,
    })
  })

  it('el total es exactamente pasajes + cargo, sin comisión', () => {
    // La comisión es un acuerdo con la empresa: no se le cobra al cliente ni
    // aparece en el desglose.
    const desglose = calcularDesglose([{ precio: 200000 }], cargoFijo)
    expect(desglose.total).toBe(desglose.importePasajes + desglose.cargoServicio)
    expect(desglose.total).toBe(215000)
  })

  it('no rompe la suma cuando el monto fijo llega como string', () => {
    // `150000 + "15000.00"` daría "15000015000.00" si no se normalizara.
    const desglose = calcularDesglose([{ precio: 150000 }], cargoFijo)
    expect(desglose.total).toBe(165000)
    expect(typeof desglose.total).toBe('number')
  })
})

describe('sumarDesgloses', () => {
  it('suma ida y vuelta manteniendo la separación de conceptos', () => {
    const ida = calcularDesglose([{ precio: 150000 }], cargoPorcentual)
    const vuelta = calcularDesglose([{ precio: 100000 }], cargoFijo)

    expect(sumarDesgloses(ida, vuelta)).toEqual({
      importePasajes: 250000,
      cargoServicio: 30000,
      total: 280000,
    })
  })

  it('devuelve ceros cuando no hay tramos', () => {
    expect(sumarDesgloses()).toEqual({
      importePasajes: 0,
      cargoServicio: 0,
      total: 0,
    })
  })
})

describe('describirCargoServicio', () => {
  it('muestra el porcentaje cuando el cargo es PORCENTUAL', () => {
    expect(describirCargoServicio(cargoPorcentual)).toBe(
      'Cargo por servicio (10%)',
    )
  })

  it('muestra sólo el nombre cuando el cargo es FIJO', () => {
    expect(describirCargoServicio(cargoFijo)).toBe('Cargo fijo')
  })
})

describe('formatearGuaranies', () => {
  it('formatea sin decimales', () => {
    const formateado = formatearGuaranies(150000)
    expect(formateado).not.toContain(',00')
    expect(formateado).toContain('150.000')
  })
})
