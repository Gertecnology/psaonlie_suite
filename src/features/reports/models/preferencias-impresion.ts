/**
 * Cómo se quiere el papel.
 *
 * Son las preferencias que un navegador te ofrece en su propio diálogo de
 * impresión, con una diferencia que importa: acá se eligen **antes** de ver la
 * hoja, y la vista previa las aplica sobre el mismo DOM que después se imprime.
 * En el diálogo del navegador se eligen a ciegas y el resultado recién se ve
 * cuando ya salió.
 *
 * Se guardan por usuario: quien imprime la liquidación en horizontal la imprime
 * así todos los meses, y volver a elegirlo cada vez es trabajo que la pantalla
 * puede ahorrarse.
 */

/** Medidas en milímetros, que es la unidad en que `@page` entiende el papel. */
export const TAMANOS_PAPEL = {
  a4: { etiqueta: 'A4', ancho: 210, alto: 297 },
  carta: { etiqueta: 'Carta', ancho: 216, alto: 279 },
  oficio: { etiqueta: 'Oficio', ancho: 216, alto: 356 },
} as const

export type TamanoPapel = keyof typeof TAMANOS_PAPEL

export const ORIENTACIONES = {
  vertical: 'Vertical',
  horizontal: 'Horizontal',
} as const

export type Orientacion = keyof typeof ORIENTACIONES

/**
 * Los márgenes, en milímetros: arriba/abajo y a los lados.
 *
 * «Estrecho» existe para las planillas anchas —conciliación, ventas cobradas
 * sin boleto—, donde ganar dos centímetros a cada lado es la diferencia entre
 * que una columna entre o que la hoja salga cortada.
 */
export const MARGENES = {
  normal: { etiqueta: 'Normales', vertical: 14, lateral: 12 },
  estrecho: { etiqueta: 'Estrechos', vertical: 8, lateral: 8 },
  amplio: { etiqueta: 'Amplios', vertical: 20, lateral: 18 },
} as const

export type Margen = keyof typeof MARGENES

export interface PreferenciasImpresion {
  tamano: TamanoPapel
  orientacion: Orientacion
  margen: Margen
  /**
   * El fondo alternado de los renglones.
   *
   * Se puede apagar: en una impresora láser el gris de la cebra es tóner en
   * cada hoja, y en una planilla de doscientos renglones eso se nota. Apagarla
   * no cambia qué dice el informe.
   */
  cebra: boolean
}

export const PREFERENCIAS_POR_DEFECTO: PreferenciasImpresion = {
  tamano: 'a4',
  orientacion: 'vertical',
  margen: 'normal',
  cebra: true,
}

/** Milímetros a píxeles CSS, que es como el navegador mide a 96 dpi. */
export function aPixeles(milimetros: number): number {
  return (milimetros * 96) / 25.4
}

/** El tamaño de la hoja en píxeles, ya girada si va horizontal. */
export function hojaEnPixeles(preferencias: PreferenciasImpresion): {
  ancho: number
  alto: number
} {
  const papel = TAMANOS_PAPEL[preferencias.tamano]
  const vertical = preferencias.orientacion === 'vertical'
  return {
    ancho: aPixeles(vertical ? papel.ancho : papel.alto),
    alto: aPixeles(vertical ? papel.alto : papel.ancho),
  }
}

/**
 * La regla `@page` que la impresión va a obedecer.
 *
 * Se inyecta en el documento en lugar de vivir en la hoja de estilos porque
 * `@page` no acepta variables CSS: el tamaño y los márgenes tienen que estar
 * escritos literales en la regla.
 */
export function reglaDePagina(preferencias: PreferenciasImpresion): string {
  const papel = TAMANOS_PAPEL[preferencias.tamano]
  const { vertical, lateral } = MARGENES[preferencias.margen]
  return `@page { size: ${papel.ancho}mm ${papel.alto}mm ${preferencias.orientacion === 'vertical' ? 'portrait' : 'landscape'}; margin: ${vertical}mm ${lateral}mm; }`
}

/**
 * Cuántas hojas va a ocupar, a partir del alto que mide el contenido.
 *
 * Es una estimación y la pantalla lo dice así: el navegador puede correr un
 * renglón a la hoja siguiente para no partirlo, y entonces sale una hoja más.
 * Sirve para lo que se usa —saber si son dos hojas o veinte antes de mandar a
 * imprimir— y no para prometer un número exacto.
 */
export function hojasEstimadas(
  altoDelContenido: number,
  preferencias: PreferenciasImpresion,
): number {
  const { alto } = hojaEnPixeles(preferencias)
  const util = alto - aPixeles(MARGENES[preferencias.margen].vertical * 2)
  if (util <= 0 || altoDelContenido <= 0) return 1
  return Math.max(1, Math.ceil(altoDelContenido / util))
}
