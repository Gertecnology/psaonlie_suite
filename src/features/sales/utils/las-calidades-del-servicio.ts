import type { Asiento } from '../models/sales.model'

/**
 * Qué calidades tiene un colectivo, y a qué precio cada una.
 *
 * Un mismo servicio mezcla calidades: el piso de abajo cama y el de arriba
 * semicama, o unas pocas filas ejecutivas adelante. La pantalla mostraba un
 * precio por butaca elegida y nada más, así que quien vendía no tenía cómo
 * saber por qué la 41 salía más cara que la 01 hasta hacer la cuenta.
 *
 * El orden es por precio, de la más barata a la más cara. La primera es la
 * calidad de base del vehículo y se dibuja sin adorno; las que siguen llevan
 * un borde distinto en el plano, porque hay vendedores que no distinguen dos
 * tonos parecidos.
 */

export interface CalidadDelServicio {
  /** Como la nombra la transportista: «Común», «Semi Cama». */
  calidad: string
  /** El precio del pasaje, sin el cargo por servicio. */
  precio: number
  /** Cuántas butacas de esta calidad tiene el vehículo. */
  butacas: number
}

/** Las clases de borde con que se dibuja cada calidad, por orden de precio. */
export const BORDES_POR_CALIDAD = [
  'border',
  'border-2 border-double',
  'border-2 border-dotted',
] as const

export function leerCalidades(asientos: Asiento[]): CalidadDelServicio[] {
  const porCalidad = new Map<string, CalidadDelServicio>()

  for (const asiento of asientos) {
    const calidad = (asiento.calidad ?? '').trim() || 'Sin especificar'
    const yaVista = porCalidad.get(calidad)

    if (yaVista) {
      yaVista.butacas += 1
      // El precio de una calidad es el más bajo que se vio: la transportista
      // manda -1 en las butacas que no están a la venta, y ese -1 no es un
      // precio. Se descartan más abajo.
      continue
    }

    porCalidad.set(calidad, { calidad, precio: asiento.precio, butacas: 1 })
  }

  return [...porCalidad.values()]
    .filter((entrada) => entrada.precio > 0)
    .sort((a, b) => a.precio - b.precio || a.calidad.localeCompare(b.calidad))
}

/**
 * Con qué borde se dibuja una butaca.
 *
 * Una sola calidad no necesita distinguirse de nada, así que va sin adorno.
 */
export function bordeDeLaCalidad(
  calidad: string | undefined,
  calidades: CalidadDelServicio[],
): string {
  if (calidades.length < 2) return BORDES_POR_CALIDAD[0]

  const indice = calidades.findIndex(
    (entrada) => entrada.calidad === ((calidad ?? '').trim() || 'Sin especificar'),
  )

  return BORDES_POR_CALIDAD[Math.max(indice, 0)] ?? BORDES_POR_CALIDAD[0]
}
