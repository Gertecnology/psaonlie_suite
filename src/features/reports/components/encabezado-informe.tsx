import { formatearEmisionISO, formatearFechaISO } from '@/lib/formato'
import { useAuth } from '@/context/auth-context'
import type { PeriodoInforme } from '../models/informe.model'

interface EncabezadoInformeProps {
  titulo: string
  /** Period the backend echoed back, not the one that was requested. */
  periodo?: PeriodoInforme
  /** API path the figures came from. */
  origen: string
  /** Instant the data arrived, so reprinting does not change the stamp. */
  emitidoEn: Date
  /** Filters in force, already worded for a reader. */
  filtros?: Array<{ etiqueta: string; valor: string }>
}

/**
 * Identifies a report so it can be read away from the screen that produced it.
 *
 * A printed table of figures with no header is unusable evidence: there is no
 * way to tell what period it covers, when it was produced, who produced it, or
 * against what to reconcile it. That is what ISO 9001 §7.5 asks of documented
 * information, and what an auditor asks first.
 *
 * Dates are ISO 8601 on purpose. `08/09` is ambiguous once the document leaves
 * the country that wrote it, and a report is exactly the kind of thing that
 * gets emailed and filed.
 */
export function EncabezadoInforme({
  titulo,
  periodo,
  origen,
  emitidoEn,
  filtros = [],
}: EncabezadoInformeProps) {
  const { user } = useAuth()

  const emisor = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : 'No identificado'

  return (
    <header className='bg-muted/30 mb-6 rounded-md border p-4 print:mb-4 print:border-black print:bg-transparent'>
      <h2 className='text-lg font-semibold'>{titulo}</h2>

      <dl className='mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3'>
        <Dato etiqueta='Período'>
          {periodo ? (
            <>
              <time dateTime={periodo.desde}>{formatearFechaISO(periodo.desde)}</time>
              {' a '}
              <time dateTime={periodo.hasta}>{formatearFechaISO(periodo.hasta)}</time>
              <span className='text-muted-foreground'>
                {' '}
                ({periodo.dias} {periodo.dias === 1 ? 'día' : 'días'})
              </span>
            </>
          ) : (
            '—'
          )}
        </Dato>

        <Dato etiqueta='Emitido'>
          <time dateTime={emitidoEn.toISOString()}>
            {formatearEmisionISO(emitidoEn)}
          </time>
        </Dato>

        <Dato etiqueta='Emitido por'>{emisor}</Dato>

        {filtros.map((filtro) => (
          <Dato key={filtro.etiqueta} etiqueta={filtro.etiqueta}>
            {filtro.valor}
          </Dato>
        ))}

        {/* De dónde salieron las cifras: sin esto, dos informes que difieren no
            se pueden contrastar contra su fuente. */}
        <Dato etiqueta='Origen'>
          <code className='text-xs'>{origen}</code>
        </Dato>

        <Dato etiqueta='Moneda'>Guaraníes (PYG, ISO 4217)</Dato>
      </dl>
    </header>
  )
}

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className='text-muted-foreground text-xs tracking-wide uppercase'>
        {etiqueta}
      </dt>
      <dd className='font-medium'>{children}</dd>
    </div>
  )
}
