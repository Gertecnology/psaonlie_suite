import { Link } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import { PageLayout } from '@/components/layout/page-layout'
import { INFORMES, type IdInforme } from '../models/informe.model'

/**
 * Reports that already have a screen.
 *
 * The catalogue in `informe.model.ts` lists every endpoint the backend exposes;
 * this is the subset that is built. Offering a link to a route that does not
 * exist is worse than not offering it, and the list grows as each one lands.
 */
const DISPONIBLES = {
  'resumen-financiero': '/reports/resumen-financiero',
  'por-agencia': '/reports/por-agencia',
  'estado-ventas': '/reports/estado-ventas',
  'por-metodo-pago': '/reports/por-metodo-pago',
  comparativo: '/reports/comparativo',
  'conciliacion-bancard': '/reports/conciliacion-bancard',
} as const satisfies Partial<Record<IdInforme, string>>

/**
 * Ledger views. Separate from the reports on purpose.
 *
 * The reports above are computed from `ventas`; these are the sum of the
 * ledger's own movements. They should agree, and while the ledger is in its
 * verification phase the difference between the two is the point — so
 * presenting them as one list would suggest they are interchangeable.
 */
const KARDEX = [
  {
    ruta: '/reports/kardex-saldos',
    titulo: 'Saldos del kardex',
    responde: '¿Qué dice el libro de movimientos?',
    descripcion:
      'Lo que se le debe a cada empresa sumando los asientos, para contrastarlo con el informe de saldos.',
  },
] as const

/**
 * The reports index.
 *
 * The seven reports used to be tabs inside one route, which made the section a
 * single opaque page: you could not link to a report, the back button did not
 * return to the previous one, and opening any of them loaded the code for all.
 *
 * Each one is a page now, and this lists them. The card leads with the question
 * the report answers, not with its title — because that is how someone picks
 * one: they arrive with a question, not with a report name in mind.
 */
export function IndiceInformes() {
  return (
    <PageLayout
      title='Informes'
      description='Elegí el informe que necesitás. Cada uno se genera con los filtros que le indiques.'
      showSearch={false}
    >
      <ul className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        {INFORMES.filter((informe) => informe.id in DISPONIBLES).map((informe) => (
          <li key={informe.id}>
            <Link
              to={DISPONIBLES[informe.id as keyof typeof DISPONIBLES]}
              className='hover:border-primary focus-visible:ring-ring group block h-full rounded-md border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none'
            >
              <p className='text-muted-foreground text-sm'>{informe.responde}</p>
              <h3 className='mt-1 flex items-center gap-2 font-semibold'>
                {informe.titulo}
                <ArrowRight className='h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100' />
              </h3>
              <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                {informe.descripcion}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <section className='mt-10'>
        <h2 className='font-semibold'>Kardex</h2>
        <p className='text-muted-foreground mb-4 max-w-prose text-sm'>
          El libro de movimientos. Todavía está en verificación: escribe pero
          los informes de arriba no lo leen, así que sirve para contrastar, no
          para reemplazarlos.
        </p>
        <ul className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
          {KARDEX.map((vista) => (
            <li key={vista.ruta}>
              <Link
                to={vista.ruta}
                className='hover:border-primary focus-visible:ring-ring group block h-full rounded-md border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none'
              >
                <p className='text-muted-foreground text-sm'>{vista.responde}</p>
                <h3 className='mt-1 flex items-center gap-2 font-semibold'>
                  {vista.titulo}
                  <ArrowRight className='h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100' />
                </h3>
                <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
                  {vista.descripcion}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </PageLayout>
  )
}
