/**
 * Catálogo de informes.
 *
 * El identificador viaja en la URL (`?informe=empresas`), así que un informe
 * concreto con sus filtros se puede compartir por link.
 */
export const INFORMES = [
  'ventas',
  'empresas',
  'estados',
  'metodos-pago',
  'rutas',
  'comparativo',
  'conciliacion',
] as const

export type IdInforme = (typeof INFORMES)[number]

export const INFORME_POR_DEFECTO: IdInforme = 'ventas'

export interface DefinicionInforme {
  id: IdInforme
  titulo: string
  /** Qué pregunta responde. Aparece bajo el título, no como tooltip. */
  descripcion: string
}

export const DEFINICIONES: DefinicionInforme[] = [
  {
    id: 'ventas',
    titulo: 'Ventas por período',
    descripcion:
      'Detalle de cada venta con sus tres montos separados: pasaje, cargo por servicio y lo efectivamente cobrado.',
  },
  {
    id: 'empresas',
    titulo: 'Por empresa y saldo',
    descripcion:
      'Cuánto se le debe transferir a cada empresa: el pasaje cobrado menos nuestra comisión.',
  },
  {
    id: 'estados',
    titulo: 'Por estado',
    descripcion:
      'Distribución de las ventas entre estados de pago y de venta, y dónde se traban.',
  },
  {
    id: 'metodos-pago',
    titulo: 'Por método de pago',
    descripcion: 'Cuánto entra por cada forma de cobro y en cuántas ventas.',
  },
  {
    id: 'rutas',
    titulo: 'Por ruta',
    descripcion: 'Qué tramos venden y cuánto facturan en el período.',
  },
  {
    id: 'comparativo',
    titulo: 'Comparativo entre períodos',
    descripcion:
      'El período elegido contra el inmediatamente anterior, métrica por métrica.',
  },
  {
    id: 'conciliacion',
    titulo: 'Conciliación de pagos',
    descripcion:
      'Lo que registró la pasarela contra lo que dice el libro de ventas, y las diferencias.',
  },
]

/** `true` si el texto es un informe conocido. */
export function esIdInforme(valor: string | undefined): valor is IdInforme {
  return INFORMES.includes(valor as IdInforme)
}
