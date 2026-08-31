import type { Asiento, ConfiguracionBus } from '../models/sales.model'
import { armarPlanoDelPiso, hayPosiciones } from './plano-del-colectivo'

/**
 * Buscar N butacas juntas.
 *
 * Una delegación de dieciocho quiere viajar junta, y encontrar dieciocho
 * libres seguidas mirando el plano y clickeando una por una es la parte lenta
 * de la venta: al que vende le lleva un minuto largo y se equivoca de butaca
 * al menos una vez.
 *
 * «Juntas» es en el orden en que se sube al colectivo: fila por fila, de
 * adelante hacia atrás, y dentro de cada fila de izquierda a derecha. El
 * pasillo no corta el grupo —la 03 está al lado de la 02 aunque haya pasillo
 * entre medio—, pero una butaca ocupada sí.
 */

/** Las butacas de un piso en el orden en que se recorre el vehículo. */
function enOrdenDelPlano(
  asientos: Asiento[],
  piso: number,
  configuracion: ConfiguracionBus,
): Asiento[] {
  if (!hayPosiciones(asientos)) {
    // Sin posición no hay plano, y el orden del arreglo es lo único que hay.
    return asientos
  }

  return armarPlanoDelPiso(asientos, piso, configuracion).filas.flatMap((fila) =>
    fila.flatMap((celda) => (celda.tipo === 'butaca' ? [celda.asiento] : [])),
  )
}

/**
 * La primera corrida de `cuantas` butacas libres, o null si no hay.
 *
 * Se busca piso por piso: un grupo repartido entre el piso 1 y el 2 no está
 * junto, por más que los números sean consecutivos.
 */
export function buscarJuntas(
  asientos: Asiento[],
  cuantas: number,
  configuracion: ConfiguracionBus,
): Asiento[] | null {
  if (cuantas < 1) return null

  const pisos = [...new Set(asientos.map((asiento) => asiento.piso ?? 1))].sort(
    (a, b) => a - b,
  )

  for (const piso of pisos) {
    const delPiso = enOrdenDelPlano(
      asientos.filter((asiento) => (asiento.piso ?? 1) === piso),
      piso,
      configuracion,
    )

    let corrida: Asiento[] = []
    for (const asiento of delPiso) {
      // El -1 marca una butaca que no está a la venta: cuenta como ocupada
      // aunque la transportista la informe libre.
      corrida = asiento.disponible && asiento.precio > 0 ? [...corrida, asiento] : []

      if (corrida.length === cuantas) return corrida
    }
  }

  return null
}

/**
 * El rango entre dos butacas, en el orden del plano.
 *
 * Es lo que hace ⇧+clic: se marca la primera, se marca la última, y se llevan
 * todas las libres que hay entre las dos. Las ocupadas del medio se saltean en
 * vez de cortar — quien arrastra sobre media fila espera que se elija lo que
 * se puede, no que no pase nada.
 *
 * Un rango que cruza de piso no existe: se devuelve sólo el tramo del piso
 * donde está la primera.
 */
export function rangoEntre(
  asientos: Asiento[],
  desde: Asiento,
  hasta: Asiento,
  configuracion: ConfiguracionBus,
): Asiento[] {
  const piso = desde.piso ?? 1
  if ((hasta.piso ?? 1) !== piso) return [hasta]

  const delPiso = enOrdenDelPlano(
    asientos.filter((asiento) => (asiento.piso ?? 1) === piso),
    piso,
    configuracion,
  )

  const inicio = delPiso.findIndex((asiento) => asiento.numero === desde.numero)
  const fin = delPiso.findIndex((asiento) => asiento.numero === hasta.numero)
  if (inicio < 0 || fin < 0) return [hasta]

  return delPiso
    .slice(Math.min(inicio, fin), Math.max(inicio, fin) + 1)
    .filter((asiento) => asiento.disponible && asiento.precio > 0)
}
