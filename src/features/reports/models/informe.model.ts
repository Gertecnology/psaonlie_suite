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
  | 'por-vendedor'
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
  /**
   * API path, only when it cannot be `ruta`.
   *
   * It exists for the single case below. Keeping it in the catalogue and not
   * hardcoded in the screen is what stops the traceability header — which
   * prints the endpoint the figures came from — from naming a path that
   * returns 404 to whoever tries to reproduce the report.
   */
  endpoint?: string
  titulo: string
  /**
   * Código del informe, como lo lleva impreso el documento.
   *
   * Existe para que una hoja archivada se pueda pedir por su nombre corto sin
   * tener que describirla: «traeme el INF-ADM-002 de agosto». Es fijo por
   * informe y no cambia aunque cambie el título de la pantalla.
   */
  codigo: string
  /**
   * Cómo se llama el documento en el papel, en mayúsculas.
   *
   * No es el título de la pantalla: la pantalla dice «Saldo por empresa», que
   * es la pregunta que contesta; el documento dice «LIQUIDACIÓN A EMPRESAS
   * TRANSPORTISTAS», que es lo que es.
   */
  documento: string
  /**
   * Ruta completa de la que salen las cifras, cuando no cuelga de
   * `/api/admin/informes`.
   *
   * El pie de la hoja la imprime para que otro pueda reproducir el documento.
   * El kardex es el caso: sus saldos salen de `/api/admin/kardex/saldos`, y sin
   * este campo el pie nombraría una ruta que devuelve 404 a quien la siga —
   * exactamente lo que el pie existe para evitar.
   */
  origen?: string
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
    codigo: 'INF-ADM-001',
    documento: 'ESTADO DE RESULTADOS DEL PERÍODO',
    descripcion:
      'Cuánto se cobró, cuánto se le debe a cada empresa y cuánto quedó como ingreso propio.',
    responde: '¿El período cierra?',
  },
  {
    id: 'por-agencia',
    ruta: 'por-agencia',
    titulo: 'Saldo por empresa',
    codigo: 'INF-ADM-002',
    documento: 'LIQUIDACIÓN A EMPRESAS TRANSPORTISTAS',
    descripcion:
      'Lo que hay que transferirle a cada empresa, con la comisión vigente y las ventas cobradas sin boleto.',
    responde: '¿Cuánto le transfiero a cada una?',
    paginado: true,
  },
  {
    id: 'por-vendedor',
    ruta: 'por-vendedor',
    titulo: 'Comisiones por vendedor',
    codigo: 'INF-ADM-003',
    documento: 'LIQUIDACIÓN DE COMISIONES A VENDEDORES',
    descripcion:
      'Lo que vendió cada persona en la caja, lo que se le reconoció, lo que ' +
      'se le revirtió por devoluciones y lo que se le debe hoy.',
    responde: '¿Cuánto le tengo que pagar a cada vendedor?',
    paginado: true,
  },
  {
    id: 'estado-ventas',
    ruta: 'estado-ventas',
    titulo: 'Estado de las ventas',
    codigo: 'INF-ADM-004',
    documento: 'COMPOSICIÓN DE LAS VENTAS DEL PERÍODO',
    descripcion:
      'Cómo se reparten las ventas del período por estado, con los indicadores que requieren atención.',
    responde: '¿Qué quedó a medio camino?',
  },
  {
    id: 'por-metodo-pago',
    ruta: 'por-metodo-pago',
    titulo: 'Por método de pago',
    codigo: 'INF-ADM-005',
    documento: 'RECAUDACIÓN POR MEDIO DE COBRO',
    descripcion:
      'Cobrado e ingreso propio por método, con la tasa de concreción de cada uno.',
    responde: '¿Qué medio de cobro funciona mejor?',
    filtros: ['metodoPago'],
  },
  {
    id: 'por-ruta',
    ruta: 'por-ruta',
    titulo: 'Por ruta',
    codigo: 'INF-ADM-006',
    documento: 'VENTAS POR TRAYECTO',
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
    codigo: 'INF-ADM-007',
    documento: 'VENTAS POR SERVICIO',
    descripcion:
      'Desglose por servicio y calidad, con el primer y el último viaje del período.',
    responde: '¿Qué servicios se venden?',
    paginado: true,
  },
  {
    id: 'serie-temporal',
    ruta: 'serie-temporal',
    titulo: 'Evolución en el tiempo',
    codigo: 'INF-ADM-008',
    documento: 'EVOLUCIÓN DEL PERÍODO',
    descripcion:
      'El período agrupado por día, semana o mes, para ver la tendencia y no sólo el total.',
    responde: '¿Cómo viene la curva?',
    filtros: ['agruparPor'],
  },
  {
    id: 'comparativo',
    ruta: 'comparativo',
    titulo: 'Comparativo entre períodos',
    codigo: 'INF-ADM-009',
    documento: 'COMPARATIVO ENTRE PERÍODOS',
    descripcion:
      'Dos períodos completos enfrentados, con la variación de cada cifra.',
    responde: '¿Mejoró o empeoró?',
    filtros: ['comparativo'],
  },
  {
    id: 'conciliacion-bancard',
    ruta: 'conciliacion-bancard',
    titulo: 'Conciliación con Bancard',
    codigo: 'INF-ADM-010',
    documento: 'CONCILIACIÓN CON LA PASARELA BANCARD',
    descripcion:
      'Lo que dice Bancard contra lo que quedó registrado, con el detalle de cada descuadre.',
    responde: '¿Coincide lo cobrado con lo que liquidó la pasarela?',
    paginado: true,
  },
  {
    id: 'ventas-sin-boleto',
    ruta: 'ventas-sin-boleto',
    endpoint: 'ventas-pagadas-sin-boleto',
    titulo: 'Ventas cobradas sin boleto',
    codigo: 'INF-ADM-011',
    documento: 'VENTAS COBRADAS SIN BOLETO EMITIDO',
    descripcion:
      'Ventas con el pago registrado y sin pasaje emitido, con su antigüedad y el contacto del cliente.',
    responde: '¿A quién le cobramos y no le dimos el pasaje?',
    paginado: true,
  },
  {
    id: 'anomalias',
    ruta: 'anomalias',
    titulo: 'Anomalías',
    codigo: 'INF-ADM-012',
    documento: 'PARTIDAS OBSERVADAS',
    descripcion:
      'Ventas que no encajan en ningún caso normal y hay que mirar a mano.',
    responde: '¿Qué se rompió?',
    paginado: true,
  },
] as const

export function informePorRuta(ruta: string): DefinicionInforme | undefined {
  return INFORMES.find((informe) => informe.ruta === ruta)
}

/**
 * The path under `/api/admin/informes` this report is fetched from.
 *
 * Almost always the same string as the browser route; the one report where it
 * is not declares `endpoint`. Callers use this instead of `ruta` so the
 * exception lives in the catalogue and not scattered across screens.
 */
export function rutaApi(definicion: DefinicionInforme): string {
  return definicion.endpoint ?? definicion.ruta
}

/** True once the user pressed Generar and there is a period to report on. */
export function estaGenerado(filtros: FiltrosInforme): boolean {
  return Boolean(filtros.generado && filtros.desde && filtros.hasta)
}
