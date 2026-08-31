import type { Asiento, ConfiguracionBus } from '../models/sales.model'

/**
 * Arma el plano de un piso a partir de dónde está cada butaca.
 *
 * ## Por qué existe
 *
 * El plano armaba sus filas con `slice(i, i + columnas)`: partía el arreglo de
 * butacas **por índice**, no por la posición real de cada una. Con las
 * ocupadas fuera de la lista los números saltaban —13, 20, 23— y cada butaca
 * aparecía donde le tocó en el arreglo, no donde va en el vehículo.
 *
 * La posición sí llega: la transportista manda `Fila` y `Columna` y el backend
 * las guarda en cada asiento. Sólo hacía falta usarlas.
 *
 * ## Cuando no hay posición
 *
 * El backend cae a `1` si la empresa no informa la fila. Ahí todas comparten
 * fila y no hay plano que dibujar: `hayPosiciones` lo detecta y quien llama
 * puede volver a la lista simple. Dibujar un plano inventado es peor que no
 * dibujarlo.
 */

/** Una celda del plano: una butaca, un hueco, o el pasillo. */
export type Celda =
  | { tipo: 'butaca'; asiento: Asiento }
  | { tipo: 'hueco' }
  | { tipo: 'pasillo' }

export interface PlanoDelPiso {
  /** Las filas, de adelante hacia atrás. */
  filas: Celda[][]
  /** Las letras de columna que se usaron, en orden. */
  columnas: string[]
}

/**
 * Después de qué columna va el pasillo.
 *
 * El esquema viene como '2-2' o '1-2-1': cada número es un bloque de butacas y
 * entre bloque y bloque hay pasillo. Sin esquema, un colectivo de cuatro
 * columnas es 2-2, que es lo que hay en el 99 % de los casos.
 */
export function cortesDePasillo(
  esquema: string | undefined,
  columnas: number,
): number[] {
  const bloques = (esquema ?? '')
    .split('-')
    .map((parte) => parseInt(parte, 10))
    .filter((parte) => Number.isFinite(parte) && parte > 0)

  if (bloques.length < 2) {
    // Sin esquema: el pasillo va al medio si el ancho es par, y no hay pasillo
    // si es una sola columna.
    if (columnas < 2) return []
    return [Math.floor(columnas / 2)]
  }

  const cortes: number[] = []
  let acumulado = 0
  for (const bloque of bloques.slice(0, -1)) {
    acumulado += bloque
    cortes.push(acumulado)
  }
  return cortes
}

/** Hay información de posición si las butacas no comparten todas la misma fila. */
export function hayPosiciones(asientos: Asiento[]): boolean {
  const filas = new Set(
    asientos.map((asiento) => asiento.fila).filter((fila) => fila !== undefined),
  )
  return filas.size > 1
}

export function armarPlanoDelPiso(
  asientos: Asiento[],
  piso: number,
  configuracion: ConfiguracionBus,
): PlanoDelPiso {
  const delPiso = asientos.filter((asiento) => asiento.piso === piso)

  // Las letras que de verdad aparecen, ordenadas. No se toman de la
  // configuración porque una empresa puede declarar cuatro columnas y usar
  // tres: la fila quedaría con un hueco al final que no existe.
  const columnas = [
    ...new Set(delPiso.map((asiento) => asiento.columna).filter(Boolean)),
  ].sort() as string[]

  const anchoDeclarado = configuracion.columnas || columnas.length
  const esquema = configuracion.distribuciones?.find(
    (distribucion) => distribucion.piso === piso,
  )?.esquema

  const cortes = cortesDePasillo(esquema, columnas.length || anchoDeclarado)

  const numerosDeFila = [
    ...new Set(delPiso.map((asiento) => asiento.fila ?? 1)),
  ].sort((a, b) => a - b)

  const filas = numerosDeFila.map((numeroDeFila) => {
    const enLaFila = delPiso.filter(
      (asiento) => (asiento.fila ?? 1) === numeroDeFila,
    )

    const celdas: Celda[] = []
    columnas.forEach((letra, indice) => {
      const asiento = enLaFila.find((candidato) => candidato.columna === letra)
      celdas.push(asiento ? { tipo: 'butaca', asiento } : { tipo: 'hueco' })

      // El pasillo va DESPUÉS de la columna que cierra un bloque.
      if (cortes.includes(indice + 1) && indice + 1 < columnas.length) {
        celdas.push({ tipo: 'pasillo' })
      }
    })

    return celdas
  })

  return { filas, columnas }
}
