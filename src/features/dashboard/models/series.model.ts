import { formatearEntero } from '@/lib/formato'
import { aFechaISOLocal, diasDelPeriodo, type Periodo } from '@/lib/periodo'
import { MAXIMO_SERIES, colorDeSerie } from '@/components/ui/chart'
import type {
  EstadisticasPorEmpresa,
  EstadisticasPorMetodoPago,
  EstadisticasPorRuta,
  EstadisticasTemporales,
} from './estadisticas.model'
import {
  desgloseEmpresaCobrado,
  sumarDesgloses,
  type DesgloseDinero,
} from './finanzas.model'
import {
  ETIQUETAS_METODO_PAGO,
  METODOS_PAGO,
  type MetodoPago,
} from './ventas.model'

/**
 * Derivaciones de las series que consumen los gráficos.
 *
 * Viven fuera de los componentes por dos razones: se pueden probar sin montar
 * React, y así los archivos de componentes exportan sólo componentes (lo que
 * mantiene funcionando el fast refresh).
 */

// ─── Tendencia temporal ─────────────────────────────────────────────────────

export interface PuntoDia {
  fecha: string
  monto: number
}

/**
 * Completa con 0 los días sin ventas.
 *
 * El backend agrupa por fecha, así que **los días sin ninguna venta no
 * aparecen en el resultado**. Dibujar la serie tal cual llega une el día 3 con
 * el 7 con una recta y hace parecer que hubo actividad los días 4, 5 y 6.
 * Rellenar con ceros es la única forma de que la línea diga la verdad.
 */
export function completarDias(
  periodo: Periodo,
  temporales: EstadisticasTemporales[]
): PuntoDia[] {
  const porFecha = new Map(temporales.map((t) => [t.fecha, t.monto]))
  const total = diasDelPeriodo(periodo)
  const salida: PuntoDia[] = []

  const cursor = new Date(periodo.desde)
  cursor.setHours(0, 0, 0, 0)

  for (let i = 0; i <= total; i++) {
    if (cursor > periodo.hasta) break
    const clave = aFechaISOLocal(cursor)
    salida.push({ fecha: clave, monto: porFecha.get(clave) ?? 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  return salida
}

export interface PuntoTendencia {
  dia: number
  fechaActual: string | null
  fechaAnterior: string | null
  actual: number
  anterior: number | null
}

/**
 * Alinea las dos series por posición dentro del período, no por fecha.
 *
 * Es la única manera honesta de superponer dos rangos distintos en un solo eje
 * de valores. La alternativa —dos escalas de X, o dos ejes— inventaría una
 * correspondencia que no existe.
 */
export function armarSerieComparada(
  periodo: Periodo,
  anterior: Periodo,
  temporalesActual: EstadisticasTemporales[],
  temporalesAnterior: EstadisticasTemporales[]
): PuntoTendencia[] {
  const serieActual = completarDias(periodo, temporalesActual)
  const serieAnterior = completarDias(anterior, temporalesAnterior)
  const largo = Math.max(serieActual.length, serieAnterior.length)

  return Array.from({ length: largo }, (_, i) => ({
    dia: i + 1,
    fechaActual: serieActual[i]?.fecha ?? null,
    fechaAnterior: serieAnterior[i]?.fecha ?? null,
    actual: serieActual[i]?.monto ?? 0,
    anterior: serieAnterior[i]?.monto ?? null,
  }))
}

// ─── Ranking por empresa ────────────────────────────────────────────────────

export interface FilaRankingEmpresa {
  id: string
  nombre: string
  ventas: number
  desglose: DesgloseDinero
}

/** Identificador de la fila que agrupa la cola larga del ranking. */
export const CLAVE_OTRAS = '__otras__'

/**
 * Ordena las empresas por lo cobrado y agrupa la cola larga en "Otras".
 *
 * Veinte filas no son un ranking. Y la regla general que hay detrás: nunca se
 * genera un color nuevo para una novena serie — dos tonos generados son
 * indistinguibles bajo daltonismo y arruinan la paleta entera.
 */
export function armarFilasEmpresas(
  empresas: EstadisticasPorEmpresa[],
  maximo = MAXIMO_SERIES
): FilaRankingEmpresa[] {
  const ordenadas = empresas
    .map<FilaRankingEmpresa>((e) => ({
      id: e.empresaId,
      nombre: e.empresaNombre,
      ventas: e.cantidad,
      desglose: desgloseEmpresaCobrado(e),
    }))
    .filter((f) => f.desglose.cobradoAlCliente > 0)
    .sort((a, b) => b.desglose.cobradoAlCliente - a.desglose.cobradoAlCliente)

  if (ordenadas.length <= maximo) return ordenadas

  const cabeza = ordenadas.slice(0, maximo)
  const cola = ordenadas.slice(maximo)

  return [
    ...cabeza,
    {
      id: CLAVE_OTRAS,
      nombre: `Otras ${cola.length} empresas`,
      ventas: cola.reduce((acc, f) => acc + f.ventas, 0),
      desglose: sumarDesgloses(cola.map((f) => f.desglose)),
    },
  ]
}

// ─── Ranking por ruta ───────────────────────────────────────────────────────

export interface FilaRankingRuta {
  clave: string
  origen: string
  destino: string
  cantidad: number
  monto: number
}

/** Máximo de rutas en el ranking del panel; el resto se agrupa. */
export const MAXIMO_RUTAS = 10

export function armarFilasRutas(
  rutas: EstadisticasPorRuta[],
  maximo = MAXIMO_RUTAS
): FilaRankingRuta[] {
  const ordenadas = rutas
    .map<FilaRankingRuta>((r) => ({
      clave: `${r.origenNombre}→${r.destinoNombre}`,
      origen: r.origenNombre,
      destino: r.destinoNombre,
      cantidad: r.cantidad,
      monto: r.monto,
    }))
    .filter((r) => r.monto > 0 || r.cantidad > 0)
    .sort((a, b) => b.monto - a.monto)

  if (ordenadas.length <= maximo) return ordenadas

  const cabeza = ordenadas.slice(0, maximo)
  const cola = ordenadas.slice(maximo)

  return [
    ...cabeza,
    {
      clave: CLAVE_OTRAS,
      origen: `Otras ${cola.length} rutas`,
      destino: '',
      cantidad: cola.reduce((acc, r) => acc + r.cantidad, 0),
      monto: cola.reduce((acc, r) => acc + r.monto, 0),
    },
  ]
}

// ─── Métodos de pago ────────────────────────────────────────────────────────

export interface SegmentoMetodoPago {
  clave: string
  etiqueta: string
  descripcion: string
  monto: number
  color: string
  nota: string
}

/**
 * El color de cada método de pago está fijado por su posición en la lista de
 * métodos, no por cuánto vendió.
 *
 * Es la regla que hace que filtrar no repinte nada: si un mes no hubo ventas en
 * efectivo, Bancard sigue siendo del mismo color. Asignar por ranking haría que
 * el color cambiara de significado entre dos períodos.
 */
const COLOR_METODO: Record<string, string> = Object.fromEntries(
  METODOS_PAGO.map((metodo, indice) => [metodo, colorDeSerie(indice)])
)

export function armarSegmentosMetodos(
  metodos: EstadisticasPorMetodoPago[]
): SegmentoMetodoPago[] {
  return metodos
    .filter((m) => m.monto > 0)
    .sort((a, b) => b.monto - a.monto)
    .map((m) => {
      const ventas = `${formatearEntero(m.cantidad)} ventas`
      return {
        clave: m.metodoPago,
        etiqueta:
          ETIQUETAS_METODO_PAGO[m.metodoPago as MetodoPago] ?? m.metodoPago,
        descripcion: ventas,
        monto: m.monto,
        color: COLOR_METODO[m.metodoPago] ?? colorDeSerie(METODOS_PAGO.length),
        nota: ventas,
      }
    })
}
