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
    </PageLayout>
  )
}
