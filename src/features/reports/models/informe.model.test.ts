import { describe, expect, it } from 'vitest'
import {
  INFORMES,
  esquemaFiltrosInforme,
  estaGenerado,
  informePorRuta,
} from './informe.model'

/**
 * The rule the owner set, in one sentence: a report fetches nothing until you
 * ask it to. `estaGenerado` is the gate that enforces it, so it gets tested
 * before anything else — if it ever returns true by default, every report goes
 * back to firing a query on arrival.
 */
describe('estaGenerado', () => {
  it('un informe recién abierto NO está generado', () => {
    expect(estaGenerado({})).toBe(false)
  })

  it('elegir el período no alcanza: hace falta apretar Generar', () => {
    expect(estaGenerado({ desde: '2026-08-01', hasta: '2026-08-31' })).toBe(false)
  })

  it('la marca sin período tampoco alcanza', () => {
    // Un enlace manipulado o un estado a medias no puede disparar una consulta
    // sin fechas: el servidor caería en su ventana por defecto y el encabezado
    // diría un período que nadie pidió.
    expect(estaGenerado({ generado: true })).toBe(false)
    expect(estaGenerado({ generado: true, desde: '2026-08-01' })).toBe(false)
  })

  it('con período y Generar, sí', () => {
    expect(
      estaGenerado({
        generado: true,
        desde: '2026-08-01',
        hasta: '2026-08-31',
      }),
    ).toBe(true)
  })
})

describe('esquemaFiltrosInforme', () => {
  it('acepta las fechas en el formato que exige la API', () => {
    const resultado = esquemaFiltrosInforme.safeParse({
      desde: '2026-08-01',
      hasta: '2026-08-31',
    })

    expect(resultado.success).toBe(true)
  })

  it('rechaza un timestamp ISO con zona', () => {
    // El backend valida `YYYY-MM-DD` y devuelve 400 con cualquier otra cosa.
    // Atajarlo acá evita un viaje de ida y vuelta para nada.
    const resultado = esquemaFiltrosInforme.safeParse({
      desde: '2026-08-01T00:00:00Z',
    })

    expect(resultado.success).toBe(false)
  })

  it('rechaza una fecha que no tiene forma de fecha', () => {
    expect(esquemaFiltrosInforme.safeParse({ hasta: 'ayer' }).success).toBe(false)
  })

  it('rechaza un método de pago que no existe', () => {
    expect(
      esquemaFiltrosInforme.safeParse({ metodoPago: 'WHATSAPP' }).success,
    ).toBe(false)
  })

  it('acepta los cuatro métodos reales', () => {
    for (const metodo of ['BANCARD', 'WEPA', 'TRANSFERENCIA', 'EFECTIVO']) {
      expect(esquemaFiltrosInforme.safeParse({ metodoPago: metodo }).success).toBe(
        true,
      )
    }
  })

  it('acota el tamaño de página a lo que el backend admite', () => {
    expect(esquemaFiltrosInforme.safeParse({ tamano: 200 }).success).toBe(true)
    expect(esquemaFiltrosInforme.safeParse({ tamano: 201 }).success).toBe(false)
    expect(esquemaFiltrosInforme.safeParse({ pagina: 0 }).success).toBe(false)
  })

  it('sin filtros es válido: es el estado de un informe sin generar', () => {
    expect(esquemaFiltrosInforme.safeParse({}).success).toBe(true)
  })
})

describe('catálogo de informes', () => {
  it('cada informe tiene una ruta única', () => {
    // La ruta es a la vez el segmento de URL y el path de la API; repetirla
    // haría que dos informes se pisen.
    const rutas = INFORMES.map((informe) => informe.ruta)

    expect(new Set(rutas).size).toBe(rutas.length)
  })

  it('cada informe tiene un id único', () => {
    const ids = INFORMES.map((informe) => informe.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todos dicen qué pregunta responden', () => {
    // Es lo que se lee en el índice para elegir: quien busca un informe llega
    // con una pregunta, no con el nombre del informe en la cabeza.
    for (const informe of INFORMES) {
      expect(informe.responde.length).toBeGreaterThan(0)
      expect(informe.descripcion.length).toBeGreaterThan(0)
    }
  })

  it('se encuentra un informe por su ruta', () => {
    expect(informePorRuta('resumen-financiero')?.id).toBe('resumen-financiero')
    expect(informePorRuta('no-existe')).toBeUndefined()
  })
})
