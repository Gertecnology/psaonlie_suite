import { z } from 'zod'

/**
 * The reports section.
 *
 * Two rules shape everything here, and both came from how the reports are
 * actually used:
 *
 * 1. **One screen per report.** They used to be tabs inside a single route, so
 *    a report could not be bookmarked, the back button did not return to the
 *    previous one, and opening one loaded the code for all seven.
 *
 * 2. **Nothing loads on arrival.** Every report used to fire its query on mount
 *    with a default 30-day window — two of them fired twice. On real data that
 *    is a slow, expensive page nobody asked for. Now you pick the filters and
 *    press Generar.
 *
 * The endpoints under `/api/admin/informes` have existed on the backend all
 * along; the panel was consuming generic `/ventas/estadisticas` instead and
 * computing balances of its own.
 */

/** Filters every report understands, as the API declares them. */
export const esquemaFiltrosInforme = z.object({
  /** `YYYY-MM-DD`. The API rejects ISO timestamps with a zone. */
  desde: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
    .optional(),
  hasta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener el formato AAAA-MM-DD')
    .optional(),
  agenciaId: z.string().uuid().optional(),
  metodoPago: z.enum(['BANCARD', 'WEPA', 'TRANSFERENCIA', 'EFECTIVO']).optional(),
  origenId: z.string().uuid().optional(),
  destinoId: z.string().uuid().optional(),
  agruparPor: z.enum(['dia', 'semana', 'mes']).optional(),
  comparativoDesde: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  comparativoHasta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  pagina: z.coerce.number().int().min(1).optional(),
  tamano: z.coerce.number().int().min(1).max(200).optional(),

  /**
   * Set by the Generar button. Its absence is what makes "not generated yet" a
   * real state — without it there is always a valid default period and the
   * query has no reason to hold back.
   */
  generado: z.coerce.boolean().optional(),
})

export type FiltrosInforme = z.infer<typeof esquemaFiltrosInforme>

/** The period the API echoes back. It is what the header is built from. */
export interface PeriodoInforme {
  desde: string
  hasta: string
  dias: number
}

export type IdInforme =
  | 'resumen-financiero'
  | 'por-agencia'
  | 'estado-ventas'
  | 'por-metodo-pago'
  | 'por-ruta'
  | 'por-servicio'
  | 'serie-temporal'
  | 'comparativo'
  | 'conciliacion-bancard'
  | 'ventas-sin-boleto'
  | 'anomalias'

export interface DefinicionInforme {
  id: IdInforme
  /** Path segment and API path — they are deliberately the same. */
  ruta: string
  titulo: string
  descripcion: string
  /** What the reader should be able to answer after looking at it. */
  responde: string
  /** Extra filters beyond period and agency. */
  filtros?: Array<'metodoPago' | 'ruta' | 'agruparPor' | 'comparativo'>
  paginado?: boolean
}

/**
 * The catalogue.
 *
 * `ruta` doubles as the API path: `/informes/por-agencia` in the browser is
 * `/api/admin/informes/por-agencia` on the server. Keeping them equal means
 * there is no table of correspondences to get out of step.
 *
 * `ventas-sin-boleto` is the exception: its endpoint is
 * `ventas-pagadas-sin-boleto`, too long for a URL a person has to read.
 */
export const INFORMES: readonly DefinicionInforme[] = [
  {
    id: 'resumen-financiero',
    ruta: 'resumen-financiero',
    titulo: 'Resumen financiero',
    descripcion:
      'Cuánto se cobró, cuánto se le debe a cada empresa y cuánto quedó como ingreso propio.',
    responde: '¿El período cierra?',
  },
  {
    id: 'por-agencia',
    ruta: 'por-agencia',
    titulo: 'Saldo por empresa',
    descripcion:
      'Lo que hay que transferirle a cada empresa, con la comisión vigente y las ventas cobradas sin boleto.',
    responde: '¿Cuánto le transfiero a cada una?',
    paginado: true,
  },
  {
    id: 'estado-ventas',
    ruta: 'estado-ventas',
    titulo: 'Estado de las ventas',
    descripcion:
      'Cómo se reparten las ventas del período por estado, con los indicadores que requieren atención.',
    responde: '¿Qué quedó a medio camino?',
  },
  {
    id: 'por-metodo-pago',
    ruta: 'por-metodo-pago',
    titulo: 'Por método de pago',
    descripcion:
      'Cobrado e ingreso propio por método, con la tasa de concreción de cada uno.',
    responde: '¿Qué medio de cobro funciona mejor?',
    filtros: ['metodoPago'],
  },
  {
    id: 'por-ruta',
    ruta: 'por-ruta',
    titulo: 'Por ruta',
    descripcion:
      'Volumen y tarifa promedio de cada par origen-destino, con los boletos vigentes.',
    responde: '¿Qué rutas mueven el dinero?',
    filtros: ['ruta'],
    paginado: true,
  },
  {
    id: 'por-servicio',
    ruta: 'por-servicio',
    titulo: 'Por servicio',
    descripcion:
      'Desglose por servicio y calidad, con el primer y el último viaje del período.',
    responde: '¿Qué servicios se venden?',
    paginado: true,
  },
  {
    id: 'serie-temporal',
    ruta: 'serie-temporal',
    titulo: 'Evolución en el tiempo',
    descripcion:
      'El período agrupado por día, semana o mes, para ver la tendencia y no sólo el total.',
    responde: '¿Cómo viene la curva?',
    filtros: ['agruparPor'],
  },
  {
    id: 'comparativo',
    ruta: 'comparativo',
    titulo: 'Comparativo entre períodos',
    descripcion:
      'Dos períodos completos enfrentados, con la variación de cada cifra.',
    responde: '¿Mejoró o empeoró?',
    filtros: ['comparativo'],
  },
  {
    id: 'conciliacion-bancard',
    ruta: 'conciliacion-bancard',
    titulo: 'Conciliación con Bancard',
    descripcion:
      'Lo que dice Bancard contra lo que quedó registrado, con el detalle de cada descuadre.',
    responde: '¿Coincide lo cobrado con lo que liquidó la pasarela?',
    paginado: true,
  },
  {
    id: 'ventas-sin-boleto',
    ruta: 'ventas-sin-boleto',
    titulo: 'Ventas cobradas sin boleto',
    descripcion:
      'Ventas con el pago registrado y sin pasaje emitido, con su antigüedad y el contacto del cliente.',
    responde: '¿A quién le cobramos y no le dimos el pasaje?',
    paginado: true,
  },
  {
    id: 'anomalias',
    ruta: 'anomalias',
    titulo: 'Anomalías',
    descripcion:
      'Ventas que no encajan en ningún caso normal y hay que mirar a mano.',
    responde: '¿Qué se rompió?',
    paginado: true,
  },
] as const

export function informePorRuta(ruta: string): DefinicionInforme | undefined {
  return INFORMES.find((informe) => informe.ruta === ruta)
}

/** True once the user pressed Generar and there is a period to report on. */
export function estaGenerado(filtros: FiltrosInforme): boolean {
  return Boolean(filtros.generado && filtros.desde && filtros.hasta)
}
