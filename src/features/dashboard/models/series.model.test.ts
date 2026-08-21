import { describe, expect, it } from 'vitest'
import { periodoDesdePreset, type Periodo } from '@/lib/periodo'
import type {
  EstadisticasPorEmpresa,
  EstadisticasPorMetodoPago,
  EstadisticasPorRuta,
  EstadisticasTemporales,
} from './estadisticas.model'
import {
  CLAVE_OTRAS,
  armarFilasEmpresas,
  armarFilasRutas,
  armarSegmentosMetodos,
  armarSerieComparada,
  completarDias,
} from './series.model'

const HOY = new Date(2026, 7, 21, 12, 0, 0)

function temporal(fecha: string, monto: number): EstadisticasTemporales {
  return {
    fecha,
    ventas: 1,
    monto,
    ventasCompletadas: 0,
    montoCompletado: 0,
    serviceChargesTotal: 0,
  }
}

describe('completarDias', () => {
  it('rellena con 0 los días sin ventas', () => {
    // El backend agrupa por fecha: los días sin ninguna venta no vienen en la
    // respuesta. Sin rellenar, la línea une el día 19 con el 21 y hace parecer
    // que el 20 hubo actividad.
    const periodo: Periodo = {
      desde: new Date(2026, 7, 19, 0, 0, 0),
      hasta: new Date(2026, 7, 21, 23, 59, 59, 999),
    }

    const serie = completarDias(periodo, [
      temporal('2026-08-19', 100),
      temporal('2026-08-21', 300),
    ])

    expect(serie).toEqual([
      { fecha: '2026-08-19', monto: 100 },
      { fecha: '2026-08-20', monto: 0 },
      { fecha: '2026-08-21', monto: 300 },
    ])
  })

  it('devuelve un punto por día del período aunque no haya ninguna venta', () => {
    const periodo = periodoDesdePreset('7d', HOY)
    expect(completarDias(periodo, [])).toHaveLength(7)
  })

  it('no se pasa del último día del período', () => {
    const periodo = periodoDesdePreset('hoy', HOY)
    const serie = completarDias(periodo, [])
    expect(serie).toHaveLength(1)
    expect(serie[0].fecha).toBe('2026-08-21')
  })

  it('ignora las fechas que caen fuera del rango', () => {
    const periodo = periodoDesdePreset('hoy', HOY)
    const serie = completarDias(periodo, [temporal('2025-01-01', 999)])
    expect(serie).toEqual([{ fecha: '2026-08-21', monto: 0 }])
  })
})

describe('armarSerieComparada', () => {
  it('alinea los dos períodos por posición, no por fecha', () => {
    // Es la única manera honesta de superponer dos rangos distintos sobre un
    // solo eje de valores.
    const actual: Periodo = {
      desde: new Date(2026, 7, 20, 0, 0, 0),
      hasta: new Date(2026, 7, 21, 23, 59, 59, 999),
    }
    const anterior: Periodo = {
      desde: new Date(2026, 7, 18, 0, 0, 0),
      hasta: new Date(2026, 7, 19, 23, 59, 59, 999),
    }

    const serie = armarSerieComparada(
      actual,
      anterior,
      [temporal('2026-08-20', 500), temporal('2026-08-21', 700)],
      [temporal('2026-08-18', 300), temporal('2026-08-19', 400)]
    )

    expect(serie).toHaveLength(2)
    expect(serie[0]).toEqual({
      dia: 1,
      fechaActual: '2026-08-20',
      fechaAnterior: '2026-08-18',
      actual: 500,
      anterior: 300,
    })
    expect(serie[1].dia).toBe(2)
    expect(serie[1].actual).toBe(700)
    expect(serie[1].anterior).toBe(400)
  })

  it('deja la serie anterior en null donde no llega', () => {
    // `null` y no 0: 0 dibujaría una línea sobre el eje que dice "ese día no se
    // vendió nada", cuando en realidad ese día no existe en el período anterior.
    const actual = periodoDesdePreset('7d', HOY)
    const anterior: Periodo = {
      desde: new Date(2026, 7, 13, 0, 0, 0),
      hasta: new Date(2026, 7, 14, 23, 59, 59, 999),
    }

    const serie = armarSerieComparada(actual, anterior, [], [])
    expect(serie).toHaveLength(7)
    expect(serie[6].anterior).toBeNull()
  })
})

function empresa(
  nombre: string,
  montoPagado: number,
  comisionesPagadas = 0
): EstadisticasPorEmpresa {
  return {
    empresaId: nombre,
    empresaNombre: nombre,
    cantidad: 1,
    monto: montoPagado,
    montoPagado,
    montoPendiente: 0,
    comisiones: comisionesPagadas,
    comisionesPagadas,
    comisionesPendientes: 0,
    serviceCharges: 0,
    serviceChargesPagados: 0,
    serviceChargesPendientes: 0,
    porcentaje: 0,
  }
}

describe('armarFilasEmpresas', () => {
  it('ordena de mayor a menor por lo cobrado', () => {
    const filas = armarFilasEmpresas([
      empresa('Chica', 100),
      empresa('Grande', 900),
      empresa('Media', 500),
    ])
    expect(filas.map((f) => f.nombre)).toEqual(['Grande', 'Media', 'Chica'])
  })

  it('descarta las empresas sin nada cobrado', () => {
    const filas = armarFilasEmpresas([
      empresa('Con ventas', 100),
      empresa('Sin ventas', 0),
    ])
    expect(filas).toHaveLength(1)
    expect(filas[0].nombre).toBe('Con ventas')
  })

  it('agrupa la cola larga en una fila "Otras"', () => {
    // Nunca se genera un color nuevo para una novena serie: dos tonos
    // generados son indistinguibles bajo daltonismo.
    const muchas = Array.from({ length: 12 }, (_, i) =>
      empresa(`Empresa ${i}`, 1000 - i * 10)
    )
    const filas = armarFilasEmpresas(muchas, 8)

    expect(filas).toHaveLength(9)
    expect(filas[8].id).toBe(CLAVE_OTRAS)
    expect(filas[8].nombre).toBe('Otras 4 empresas')
  })

  it('la fila "Otras" conserva la suma exacta de la cola', () => {
    const muchas = Array.from({ length: 10 }, () => empresa('X', 1000, 100))
    const filas = armarFilasEmpresas(muchas, 8)
    const otras = filas[filas.length - 1]

    expect(otras.desglose.pasaje).toBe(2000)
    expect(otras.desglose.comision).toBe(200)
    expect(otras.desglose.netoAEmpresas).toBe(1800)
    expect(otras.ventas).toBe(2)
  })

  it('no agrupa nada cuando entran todas', () => {
    const filas = armarFilasEmpresas([empresa('A', 100), empresa('B', 200)], 8)
    expect(filas).toHaveLength(2)
    expect(filas.some((f) => f.id === CLAVE_OTRAS)).toBe(false)
  })
})

function ruta(
  origen: string,
  destino: string,
  monto: number
): EstadisticasPorRuta {
  return {
    origenNombre: origen,
    destinoNombre: destino,
    cantidad: 1,
    monto,
    porcentaje: 0,
  }
}

describe('armarFilasRutas', () => {
  it('ordena por monto y agrupa la cola', () => {
    const rutas = Array.from({ length: 14 }, (_, i) =>
      ruta(`Origen ${i}`, `Destino ${i}`, 1000 - i)
    )
    const filas = armarFilasRutas(rutas, 10)

    expect(filas).toHaveLength(11)
    expect(filas[10].clave).toBe(CLAVE_OTRAS)
    expect(filas[10].origen).toBe('Otras 4 rutas')
    expect(filas[10].destino).toBe('')
  })

  it('la clave identifica el par origen-destino', () => {
    const [fila] = armarFilasRutas([ruta('Asunción', 'Encarnación', 100)])
    expect(fila.clave).toBe('Asunción→Encarnación')
  })
})

describe('armarSegmentosMetodos', () => {
  const metodos: EstadisticasPorMetodoPago[] = [
    { metodoPago: 'BANCARD', cantidad: 10, monto: 1_000_000, porcentaje: 0 },
    { metodoPago: 'TRANSFERENCIA', cantidad: 2, monto: 200_000, porcentaje: 0 },
    { metodoPago: 'EFECTIVO', cantidad: 0, monto: 0, porcentaje: 0 },
  ]

  it('traduce las claves del backend a texto legible', () => {
    const [primero] = armarSegmentosMetodos(metodos)
    expect(primero.etiqueta).toBe('Bancard')
  })

  it('descarta los métodos sin monto', () => {
    expect(armarSegmentosMetodos(metodos)).toHaveLength(2)
  })

  it('el color sigue al método, no a su posición en el ranking', () => {
    // Si un mes no hay ventas en efectivo, Bancard tiene que seguir siendo del
    // mismo color: si el color cambiara con el orden, nadie podría aprenderlo.
    const conTodos = armarSegmentosMetodos(metodos)
    const soloUno = armarSegmentosMetodos([metodos[1]])

    const transferenciaEnAmbos = conTodos.find(
      (s) => s.clave === 'TRANSFERENCIA'
    )
    expect(soloUno[0].color).toBe(transferenciaEnAmbos?.color)
  })

  it('ordena de mayor a menor', () => {
    const segmentos = armarSegmentosMetodos(metodos)
    expect(segmentos[0].monto).toBeGreaterThan(segmentos[1].monto)
  })
})
