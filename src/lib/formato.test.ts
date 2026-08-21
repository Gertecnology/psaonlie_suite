import { describe, expect, it } from 'vitest'
import {
  aFecha,
  aNumero,
  calcularVariacion,
  formatearEntero,
  formatearFecha,
  formatearFechaCorta,
  formatearFechaHora,
  formatearGuaranies,
  formatearGuaraniesCompacto,
  formatearPorcentaje,
  formatearVariacion,
  repartirPorcentajes,
} from './formato'

/**
 * Espacio duro. `Intl` lo pone entre el símbolo de moneda y el número para
 * que "Gs." no quede colgado al final de una línea. No es un espacio común,
 * y confundirlos es la causa habitual de que un test de formato falle con dos
 * strings que se ven idénticos.
 */
const NBSP = '\u00A0'

/**
 * El formateo de dinero es la única parte del panel que el usuario lee siempre.
 * Un separador de miles perdido convierte 1.500.000 en 1500000 y nadie lo nota
 * hasta que alguien concilia mal.
 */

describe('aNumero', () => {
  it('deja pasar los números tal cual', () => {
    expect(aNumero(1500)).toBe(1500)
    expect(aNumero(-42.5)).toBe(-42.5)
    expect(aNumero(0)).toBe(0)
  })

  it('convierte los decimales que Postgres devuelve como string', () => {
    // El caso real: `importeTotal` llega como "150000.00" en varios endpoints.
    expect(aNumero('150000.00')).toBe(150000)
    expect(aNumero('2.50')).toBe(2.5)
  })

  it('devuelve 0 —no NaN— ante datos ausentes o basura', () => {
    // Un total que no se pudo leer es una fila vacía, no "NaN" en pantalla.
    expect(aNumero(null)).toBe(0)
    expect(aNumero(undefined)).toBe(0)
    expect(aNumero('')).toBe(0)
    expect(aNumero('hola')).toBe(0)
    expect(aNumero({})).toBe(0)
    expect(aNumero(Number.NaN)).toBe(0)
    expect(aNumero(Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('formatearGuaranies', () => {
  it('usa punto como separador de miles y no muestra centavos', () => {
    expect(formatearGuaranies(1234567)).toBe(`Gs.${NBSP}1.234.567`)
    expect(formatearGuaranies(1000)).toBe(`Gs.${NBSP}1.000`)
    expect(formatearGuaranies(0)).toBe(`Gs.${NBSP}0`)
  })

  it('redondea los centavos que arrastra el decimal(10,2) del backend', () => {
    // Los guaraníes no tienen centavos; el esquema sí. Mostrarlos sería ruido.
    expect(formatearGuaranies('150000.00')).toBe(`Gs.${NBSP}150.000`)
    expect(formatearGuaranies('150000.49')).toBe(`Gs.${NBSP}150.000`)
  })

  it('formatea negativos sin romperse', () => {
    expect(formatearGuaranies(-4500)).toBe(`Gs.${NBSP}-4.500`)
  })

  it('no muestra NaN cuando el dato viene mal', () => {
    expect(formatearGuaranies(undefined)).toBe(`Gs.${NBSP}0`)
    expect(formatearGuaranies('sin datos')).toBe(`Gs.${NBSP}0`)
  })
})

describe('formatearGuaraniesCompacto', () => {
  it('abrevia para los ejes de los gráficos', () => {
    expect(formatearGuaraniesCompacto(1234567)).toBe(`Gs.${NBSP}1,2${NBSP}M`)
    expect(formatearGuaraniesCompacto(1234)).toBe(`Gs.${NBSP}1,2${NBSP}K`)
  })
})

describe('formatearEntero y formatearPorcentaje', () => {
  it('agrupa los miles de los conteos', () => {
    expect(formatearEntero(1234)).toBe('1.234')
    expect(formatearEntero('33')).toBe('33')
  })

  it('muestra un decimal en los porcentajes', () => {
    expect(formatearPorcentaje(12.3456)).toBe('12,3%')
    expect(formatearPorcentaje(100)).toBe('100,0%')
  })
})

describe('calcularVariacion', () => {
  it('calcula el cambio relativo entre dos períodos', () => {
    expect(calcularVariacion(150, 100)).toBe(50)
    expect(calcularVariacion(50, 100)).toBe(-50)
    expect(calcularVariacion(100, 100)).toBe(0)
  })

  it('devuelve null cuando el período anterior fue 0', () => {
    // No existe "creció un infinito por ciento". El backend responde 0 acá, que
    // es indistinguible de "no varió" — justamente lo que se quiere evitar.
    expect(calcularVariacion(100, 0)).toBeNull()
    expect(calcularVariacion(0, 0)).toBeNull()
  })

  it('normaliza los strings antes de dividir', () => {
    expect(calcularVariacion('150.00', '100.00')).toBe(50)
  })
})

describe('formatearVariacion', () => {
  it('marca el signo de forma explícita', () => {
    expect(formatearVariacion(12.34)).toBe('+12,3%')
    expect(formatearVariacion(-5)).toBe('−5,0%')
    expect(formatearVariacion(0)).toBe('0,0%')
  })

  it('muestra un guion cuando no hay base de comparación', () => {
    expect(formatearVariacion(null)).toBe('—')
  })
})

describe('repartirPorcentajes', () => {
  it('reparte proporcionalmente', () => {
    expect(repartirPorcentajes([50, 50])).toEqual([50, 50])
    expect(repartirPorcentajes([75, 25])).toEqual([75, 25])
  })

  it('suma exactamente 100 aunque el redondeo no cierre', () => {
    // Tres tercios redondeados dan 99,9. Debajo de un gráfico de composición,
    // ese 99,9 es justo donde el lector va a verificar la cuenta.
    //
    // Se compara a una décima, que es la precisión con la que se muestran:
    // 33,3 no es exacto en punto flotante y la suma cruda da 99,99999999999999.
    const sumaMostrada = (partes: number[]) =>
      Math.round(partes.reduce((a, b) => a + b, 0) * 10) / 10

    expect(sumaMostrada(repartirPorcentajes([1, 1, 1]))).toBe(100)
    expect(
      sumaMostrada(repartirPorcentajes([100000, 33333, 33333, 33334]))
    ).toBe(100)
    expect(sumaMostrada(repartirPorcentajes([7, 1, 1, 1, 1, 1, 1]))).toBe(100)
  })

  it('le asigna el resto del redondeo a la porción más grande', () => {
    const [mayor] = repartirPorcentajes([1, 1, 1])
    expect(mayor).toBeGreaterThanOrEqual(33.3)
  })

  it('devuelve ceros cuando el total es 0', () => {
    expect(repartirPorcentajes([0, 0])).toEqual([0, 0])
  })
})

describe('fechas', () => {
  it('interpreta una fecha sin hora como fecha local, no como UTC', () => {
    // El bug clásico: `new Date('2026-08-21')` es medianoche UTC, que en
    // Paraguay (UTC−3/−4) cae el 20 de agosto. Una fecha de viaje mostrada un
    // día antes es un pasajero que llega tarde.
    const fecha = aFecha('2026-08-21')
    expect(fecha?.getFullYear()).toBe(2026)
    expect(fecha?.getMonth()).toBe(7)
    expect(fecha?.getDate()).toBe(21)
  })

  it('formatea con el orden día/mes/año', () => {
    expect(formatearFecha('2026-08-21')).toBe('21/08/2026')
  })

  it('devuelve un guion ante fechas nulas o inválidas', () => {
    expect(formatearFecha(null)).toBe('—')
    expect(formatearFecha(undefined)).toBe('—')
    expect(formatearFecha('no es una fecha')).toBe('—')
    expect(formatearFechaHora(null)).toBe('—')
    expect(formatearFechaCorta(null)).toBe('—')
  })

  it('normaliza la etiqueta corta de los ejes', () => {
    // es-PY devuelve "21-ago." con guion y punto; en un eje eso es ruido.
    expect(formatearFechaCorta('2026-08-21')).toBe('21 ago')
  })

  it('muestra la hora en 24 h', () => {
    const texto = formatearFechaHora('2026-08-21T14:30:00')
    expect(texto).toContain('21/08/2026')
    expect(texto).toContain('14:30')
  })
})
