import { describe, expect, it } from 'vitest'
import {
  aFechaISOLocal,
  aParametrosApi,
  deFechaISOLocal,
  describirPeriodo,
  diasDelPeriodo,
  finDelDia,
  inicioDelDia,
  periodoAnterior,
  periodoDesdePreset,
} from './periodo'

/**
 * Los tests corren con `TZ=America/Asuncion` (ver el script `test`): estas
 * funciones dependen de la zona horaria local a propósito, y sin fijarla los
 * resultados cambiarían de máquina en máquina.
 */

// 21 de agosto de 2026, un viernes, a media tarde.
const HOY = new Date(2026, 7, 21, 15, 30, 0)

describe('periodoDesdePreset', () => {
  it('"hoy" abarca el día completo, no desde la hora actual', () => {
    const { desde, hasta } = periodoDesdePreset('hoy', HOY)
    expect(desde.getDate()).toBe(21)
    expect(desde.getHours()).toBe(0)
    expect(hasta.getDate()).toBe(21)
    expect(hasta.getHours()).toBe(23)
    expect(hasta.getMinutes()).toBe(59)
  })

  it('"ayer" es el día anterior completo', () => {
    const { desde, hasta } = periodoDesdePreset('ayer', HOY)
    expect(desde.getDate()).toBe(20)
    expect(hasta.getDate()).toBe(20)
    expect(hasta.getHours()).toBe(23)
  })

  it('"últimos 7 días" incluye hoy y los seis anteriores', () => {
    // Siete días son siete, no ocho: la confusión de contar hoy aparte es la
    // causa habitual de que un total no coincida con el del día siguiente.
    const periodo = periodoDesdePreset('7d', HOY)
    expect(periodo.desde.getDate()).toBe(15)
    expect(periodo.hasta.getDate()).toBe(21)
    expect(diasDelPeriodo(periodo)).toBe(7)
  })

  it('"últimos 30 días" arranca 29 días atrás', () => {
    const periodo = periodoDesdePreset('30d', HOY)
    expect(periodo.desde.getMonth()).toBe(6) // julio
    expect(periodo.desde.getDate()).toBe(23)
    expect(diasDelPeriodo(periodo)).toBe(30)
  })

  it('"este mes" va del día 1 a hoy', () => {
    const { desde, hasta } = periodoDesdePreset('mes', HOY)
    expect(desde.getDate()).toBe(1)
    expect(desde.getMonth()).toBe(7)
    expect(hasta.getDate()).toBe(21)
  })

  it('"mes anterior" toma el mes completo, incluido su último día', () => {
    const { desde, hasta } = periodoDesdePreset('mes-anterior', HOY)
    expect(desde.getMonth()).toBe(6) // julio
    expect(desde.getDate()).toBe(1)
    expect(hasta.getMonth()).toBe(6)
    expect(hasta.getDate()).toBe(31) // julio tiene 31
    expect(hasta.getHours()).toBe(23)
  })

  it('resuelve bien el mes anterior cuando cambia el año', () => {
    const enero = new Date(2026, 0, 15, 10, 0, 0)
    const { desde, hasta } = periodoDesdePreset('mes-anterior', enero)
    expect(desde.getFullYear()).toBe(2025)
    expect(desde.getMonth()).toBe(11) // diciembre
    expect(hasta.getDate()).toBe(31)
  })

  it('"este año" arranca el 1 de enero', () => {
    const { desde } = periodoDesdePreset('anio', HOY)
    expect(desde.getMonth()).toBe(0)
    expect(desde.getDate()).toBe(1)
    expect(desde.getFullYear()).toBe(2026)
  })
})

describe('periodoAnterior', () => {
  it('devuelve un tramo del mismo largo, inmediatamente anterior', () => {
    const actual = periodoDesdePreset('7d', HOY)
    const anterior = periodoAnterior(actual)

    expect(anterior.hasta.getTime()).toBe(actual.desde.getTime() - 1)
    expect(diasDelPeriodo(anterior)).toBe(diasDelPeriodo(actual))
  })

  it('no solapa con el período actual', () => {
    // El backend calcula el suyo con `hasta = desde`, o sea que los dos tramos
    // se tocan en un instante. Acá el anterior termina 1 ms antes, así ninguna
    // venta se cuenta dos veces.
    const actual = periodoDesdePreset('30d', HOY)
    const anterior = periodoAnterior(actual)
    expect(anterior.hasta.getTime()).toBeLessThan(actual.desde.getTime())
  })
})

describe('aParametrosApi', () => {
  it('manda el instante completo, no sólo la fecha', () => {
    // El backend filtra con `fechaVenta BETWEEN :desde AND :hasta` sobre un
    // timestamp. Truncar `hasta` a medianoche dejaría el último día afuera.
    const periodo = periodoDesdePreset('hoy', HOY)
    const { fechaDesde, fechaHasta } = aParametrosApi(periodo)

    expect(fechaDesde).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(fechaHasta).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    expect(new Date(fechaHasta).getTime()).toBeGreaterThan(
      new Date(fechaDesde).getTime()
    )
  })

  it('el rango de hoy cubre exactamente 24 horas menos 1 ms', () => {
    const periodo = periodoDesdePreset('hoy', HOY)
    const ms =
      new Date(aParametrosApi(periodo).fechaHasta).getTime() -
      new Date(aParametrosApi(periodo).fechaDesde).getTime()
    expect(ms).toBe(24 * 60 * 60 * 1000 - 1)
  })
})

describe('serialización a la URL', () => {
  it('usa la fecha local, no UTC', () => {
    // Con `toISOString()`, un rango que empieza el 1 del mes aparecería
    // empezando el 31 del mes anterior desde Paraguay.
    const primeroDeAgosto = new Date(2026, 7, 1, 0, 0, 0)
    expect(aFechaISOLocal(primeroDeAgosto)).toBe('2026-08-01')
  })

  it('hace ida y vuelta sin correrse de día', () => {
    const original = new Date(2026, 0, 1)
    const texto = aFechaISOLocal(original)
    const recuperada = deFechaISOLocal(texto)
    expect(recuperada?.getDate()).toBe(1)
    expect(recuperada?.getMonth()).toBe(0)
    expect(recuperada?.getFullYear()).toBe(2026)
  })

  it('rechaza texto que no sea una fecha', () => {
    expect(deFechaISOLocal(undefined)).toBeNull()
    expect(deFechaISOLocal('')).toBeNull()
    expect(deFechaISOLocal('21/08/2026')).toBeNull()
    expect(deFechaISOLocal('ayer')).toBeNull()
  })
})

describe('describirPeriodo', () => {
  it('muestra un solo día cuando el rango es de un día', () => {
    const periodo = periodoDesdePreset('hoy', HOY)
    expect(describirPeriodo(periodo)).toBe('21/08/2026')
  })

  it('muestra el rango cuando abarca varios días', () => {
    const periodo = periodoDesdePreset('7d', HOY)
    expect(describirPeriodo(periodo)).toBe('15/08/2026 – 21/08/2026')
  })
})

describe('inicioDelDia y finDelDia', () => {
  it('no modifican la fecha original', () => {
    const original = new Date(2026, 7, 21, 15, 30)
    inicioDelDia(original)
    finDelDia(original)
    expect(original.getHours()).toBe(15)
    expect(original.getMinutes()).toBe(30)
  })
})
