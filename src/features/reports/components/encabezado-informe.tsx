import { formatearEmisionISO, formatearFechaISO } from '@/lib/formato'
import { useAuth } from '@/context/auth-context'
import type { PeriodoInforme } from '../models/informe.model'

interface EncabezadoInformeProps {
  titulo: string
  /** Period the backend echoed back, not the one that was requested. */
  periodo?: PeriodoInforme
  /** API path the figures came from. Printed only, never on screen. */
  origen: string
  /** Instant the data arrived, so reprinting does not change the stamp. */
  emitidoEn: Date
  /** Filters in force, already worded for a reader. */
  filtros?: Array<{ etiqueta: string; valor: string }>
}

/**
 * Identifies a report, without getting in the way of it.
 *
 * The first version of this was a five-field grid across the full width, above
 * the data — so a report opened showing the period, the timestamp, the user,
 * the API endpoint and a note saying the currency complies with ISO 4217, and
 * you had to scroll past all of that to see a single figure. Two of those
 * fields were usually empty, so it read as a wall of dashes.
 *
 * That is backwards. A report is the numbers; everything else is a caption. On
 * screen this is now one line — the period, which is the only piece a reader
 * needs to interpret the figures. The rest identifies the document and only
 * matters once it leaves the screen, so it prints and nothing more.
 *
 * The endpoint in particular has no business being visible: whoever reads a
 * report about ticket sales is not going to reproduce it by calling an API.
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
    : null

  return (
    <>
      {/* En pantalla: el período y nada más. */}
      <div className='text-muted-foreground mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm print:hidden'>
        {periodo && (
          <span>
            <time dateTime={periodo.desde}>
              {formatearFechaISO(periodo.desde)}
            </time>
            {' — '}
            <time dateTime={periodo.hasta}>
              {formatearFechaISO(periodo.hasta)}
            </time>
            <span className='ml-1 opacity-70'>
              ({periodo.dias} {periodo.dias === 1 ? 'día' : 'días'})
            </span>
          </span>
        )}
        {filtros.map((filtro) => (
          <span key={filtro.etiqueta}>
            {filtro.etiqueta}: <strong>{filtro.valor}</strong>
          </span>
        ))}
      </div>

      {/* Al imprimir: la identificación completa, porque el papel se archiva y
          se manda, y ahí sí hace falta saber de dónde salió y quién lo sacó. */}
      <div className='hidden print:mb-4 print:block print:border-b print:pb-2'>
        <h1 className='text-base font-bold'>{titulo}</h1>
        <p className='mt-1 text-xs'>
          {periodo && (
            <>
              Período {formatearFechaISO(periodo.desde)} a{' '}
              {formatearFechaISO(periodo.hasta)} · {periodo.dias}{' '}
              {periodo.dias === 1 ? 'día' : 'días'} ·{' '}
            </>
          )}
          Importes en guaraníes
          {filtros.map((filtro) => (
            <span key={filtro.etiqueta}>
              {' · '}
              {filtro.etiqueta}: {filtro.valor}
            </span>
          ))}
        </p>
        <p className='mt-0.5 text-[10px] opacity-70'>
          Emitido {formatearEmisionISO(emitidoEn)}
          {emisor && ` por ${emisor}`} · {origen}
        </p>
      </div>
    </>
  )
}
